// ============================================================
// REAL TREE GUY OS — WEATHER WORKER (UPDATED + CORS + CORRECT PATHS)
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  // ----------------------------------------------------------
  // CORS HEADERS
  // ----------------------------------------------------------
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
  };

  // ----------------------------------------------------------
  // OPTIONS (CORS preflight)
  // ----------------------------------------------------------
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // ----------------------------------------------------------
  // GET USER LOCATION (from users table)
  // ----------------------------------------------------------
  if (path === "/api/weather/location" && request.method === "GET") {
    try {
      const userId = url.searchParams.get("user");

      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing user ID" }), {
          status: 400,
          headers: CORS
        });
      }

      const user = await DB.prepare(`
        SELECT lat, lng FROM users WHERE id = ?
      `).bind(userId).first();

      if (!user) {
        return new Response(JSON.stringify({ lat: null, lon: null }), {
          headers: CORS
        });
      }

      return new Response(JSON.stringify({
        lat: user.lat || null,
        lon: user.lng || null
      }), { headers: CORS });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: CORS
      });
    }
  }

  // ----------------------------------------------------------
  // MAIN WEATHER FETCH
  // ----------------------------------------------------------
  if (path === "/api/weather" && request.method === "GET") {
    const lat = parseFloat(url.searchParams.get("lat"));
    const lon = parseFloat(url.searchParams.get("lon"));

    if (isNaN(lat) || isNaN(lon)) {
      return new Response(JSON.stringify({ error: "Missing lat/lon" }), {
        status: 400,
        headers: CORS
      });
    }

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

    // ----------------------------------------------------------
    // CACHE READ
    // ----------------------------------------------------------
    try {
      const cached = await DB.prepare(`
        SELECT data, ts FROM weather_cache WHERE key = ?
      `).bind(cacheKey).first();

      if (cached) {
        const age = Date.now() - cached.ts;
        if (age < 5 * 60 * 1000) {
          return new Response(cached.data, { headers: CORS });
        }
      }
    } catch (err) {
      console.warn("Weather cache read failed:", err.message);
    }

    // ----------------------------------------------------------
    // FETCH FROM OPEN-METEO
    // ----------------------------------------------------------
    let raw;
    try {
      const wxUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&hourly=temperature_2m,weathercode,windgusts_10m,precipitation,surface_pressure` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
        `&temperature_unit=fahrenheit&timezone=auto`;

      const res = await fetch(wxUrl);
      const text = await res.text();

      try {
        raw = JSON.parse(text);
      } catch {
        return new Response(JSON.stringify({
          error: "Weather API returned non‑JSON",
          raw: text.slice(0, 200)
        }), { status: 502, headers: CORS });
      }

    } catch (err) {
      return new Response(JSON.stringify({
        error: "Weather API failed",
        details: err.message
      }), { status: 500, headers: CORS });
    }

    // ----------------------------------------------------------
    // FORMAT WEATHER DATA
    // ----------------------------------------------------------
    const formatted = {
      current: {
        temperature: raw.current_weather.temperature,
        wind: raw.current_weather.windspeed,
        code: raw.current_weather.weathercode,
        gust: raw.hourly.windgusts_10m?.[0],
        pressure: raw.hourly.surface_pressure?.[0],
        rain: raw.hourly.precipitation?.[0]
      },
      hourly: raw.hourly.time.map((t, i) => ({
        time: t.split("T")[1],
        temp: raw.hourly.temperature_2m[i],
        code: raw.hourly.weathercode[i]
      })),
      daily: raw.daily.time.map((d, i) => ({
        day: d,
        hi: raw.daily.temperature_2m_max[i],
        lo: raw.daily.temperature_2m_min[i],
        code: raw.daily.weathercode[i]
      }))
    };

    // ----------------------------------------------------------
    // CACHE WRITE
    // ----------------------------------------------------------
    try {
      await DB.prepare(`
        INSERT OR REPLACE INTO weather_cache (key, data, ts)
        VALUES (?, ?, ?)
      `)
        .bind(cacheKey, JSON.stringify(formatted), Date.now())
        .run();
    } catch (err) {
      console.warn("Weather cache write failed:", err.message);
    }

    return new Response(JSON.stringify(formatted), { headers: CORS });
  }

  // ----------------------------------------------------------
  // FALLBACK
  // ----------------------------------------------------------
  return new Response(JSON.stringify({ error: "Weather route not found" }), {
    status: 404,
    headers: CORS
  });
}
