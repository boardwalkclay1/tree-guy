// ============================================================
// REAL TREE GUY OS — WEATHER WORKER (FINAL VERSION)
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  // ----------------------------------------------------------
  // CORS
  // ----------------------------------------------------------
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...CORS }
    });

  // ============================================================
  // ADDRESS → COORDINATES (Nominatim)
  // ============================================================
  async function geocode(address) {
    const geoUrl =
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const res = await fetch(geoUrl, {
      headers: { "User-Agent": "RealTreeGuyOS/1.0" }
    });

    const data = await res.json();
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  }

  // ============================================================
  // GET USER LOCATION FROM DB
  // ============================================================
  if (path === "/api/weather/location" && request.method === "GET") {
    try {
      const userId = url.searchParams.get("user");
      if (!userId) return json({ error: "Missing user ID" }, 400);

      const row = await DB.prepare(
        "SELECT lat, lng FROM users WHERE id = ?"
      ).bind(userId).first();

      return json({
        lat: row?.lat ?? null,
        lon: row?.lng ?? null
      });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ============================================================
  // SAVE USER LOCATION
  // ============================================================
  if (path === "/api/weather/location" && request.method === "POST") {
    try {
      const body = await request.json();
      const { user, lat, lon } = body;

      if (!user || !lat || !lon) {
        return json({ error: "Missing user/lat/lon" }, 400);
      }

      await DB.prepare(
        "UPDATE users SET lat = ?, lng = ? WHERE id = ?"
      ).bind(lat, lon, user).run();

      return json({ ok: true });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ============================================================
  // MAIN WEATHER FETCH (GPS, manual, address)
  // ============================================================
  if (path === "/api/weather" && request.method === "GET") {
    let lat = url.searchParams.get("lat");
    let lon = url.searchParams.get("lon");
    const address = url.searchParams.get("address");

    // Address lookup
    if (address) {
      const coords = await geocode(address);
      if (!coords) return json({ error: "Address not found" }, 404);
      lat = coords.lat;
      lon = coords.lon;
    }

    lat = parseFloat(lat);
    lon = parseFloat(lon);

    if (isNaN(lat) || isNaN(lon)) {
      return json({ error: "Missing lat/lon or address" }, 400);
    }

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

    // ----------------------------------------------------------
    // CACHE READ
    // ----------------------------------------------------------
    try {
      const cached = await DB.prepare(
        "SELECT data, ts FROM weather_cache WHERE key = ?"
      ).bind(cacheKey).first();

      if (cached) {
        const age = Date.now() - cached.ts;
        if (age < 5 * 60 * 1000) {
          return json(JSON.parse(cached.data));
        }
      }
    } catch (err) {
      console.warn("Cache read failed:", err.message);
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

      raw = JSON.parse(text);
    } catch (err) {
      return json({ error: "Weather API failed", details: err.message }, 500);
    }

    // ----------------------------------------------------------
    // FORMAT WEATHER DATA
    // ----------------------------------------------------------
    const formatted = {
      location: { lat, lon },
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
      await DB.prepare(
        "INSERT OR REPLACE INTO weather_cache (key, data, ts) VALUES (?, ?, ?)"
      ).bind(cacheKey, JSON.stringify(formatted), Date.now()).run();
    } catch (err) {
      console.warn("Cache write failed:", err.message);
    }

    return json(formatted);
  }

  // ----------------------------------------------------------
  // FALLBACK
  // ----------------------------------------------------------
  return json({ error: "Weather route not found" }, 404);
}
