// ============================================================
// REAL TREE GUY — WEATHER WORKER (D1 + Open‑Meteo)
// FINAL FIXED VERSION — NEVER RETURNS HTML
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;

  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // ----------------------------------------------------------
    // GET PROFILE LOCATION (D1)
    // ----------------------------------------------------------
    if (path === "/api/weather/profile" && request.method === "GET") {
      try {
        const row = await DB.prepare(
          "SELECT lat, lon FROM profile_location LIMIT 1"
        ).first();

        return Response.json(row || {});
      } catch (err) {
        return Response.json({ error: "DB read failed", details: err.message }, { status: 500 });
      }
    }

    // ----------------------------------------------------------
    // SET PROFILE LOCATION (D1)
    // ----------------------------------------------------------
    if (path === "/api/weather/profile" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!body.lat || !body.lon) {
          return Response.json({ error: "lat/lon required" }, { status: 400 });
        }

        await DB.prepare("DELETE FROM profile_location").run();
        await DB.prepare(
          "INSERT INTO profile_location (lat, lon, updated_at) VALUES (?, ?, ?)"
        )
          .bind(body.lat, body.lon, Date.now())
          .run();

        return Response.json({ ok: true });
      } catch (err) {
        return Response.json({ error: "DB write failed", details: err.message }, { status: 500 });
      }
    }

    // ----------------------------------------------------------
    // WEATHER FETCH (Open‑Meteo + D1 Cache)
    // ----------------------------------------------------------
    if (path === "/api/weather" && request.method === "GET") {
      const lat = parseFloat(url.searchParams.get("lat"));
      const lon = parseFloat(url.searchParams.get("lon"));

      if (isNaN(lat) || isNaN(lon)) {
        return Response.json({ error: "Missing lat/lon" }, { status: 400 });
      }

      const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

      // Try cache
      try {
        const cached = await DB.prepare(
          "SELECT data, ts FROM weather_cache WHERE key = ?"
        )
          .bind(cacheKey)
          .first();

        if (cached) {
          const age = Date.now() - cached.ts;
          if (age < 5 * 60 * 1000) {
            return Response.json(JSON.parse(cached.data));
          }
        }
      } catch (err) {
        // Cache read failure should NOT break weather
        console.warn("Weather cache read failed:", err.message);
      }

      // Fetch from Open‑Meteo safely
      let raw;
      try {
        const wxUrl =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current_weather=true` +
          `&hourly=temperature_2m,weathercode,windgusts_10m,precipitation,surface_pressure` +
          `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
          `&temperature_unit=fahrenheit&timezone=auto`;

        const res = await fetch(wxUrl);

        // If Open‑Meteo returns HTML → prevent crash
        const text = await res.text();
        try {
          raw = JSON.parse(text);
        } catch {
          return Response.json(
            { error: "Weather API returned non‑JSON", raw: text.slice(0, 200) },
            { status: 502 }
          );
        }
      } catch (err) {
        return Response.json({ error: "Weather API failed", details: err.message }, { status: 500 });
      }

      // Format weather
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

      // Store cache safely
      try {
        await DB.prepare(
          "INSERT OR REPLACE INTO weather_cache (key, data, ts) VALUES (?, ?, ?)"
        )
          .bind(cacheKey, JSON.stringify(formatted), Date.now())
          .run();
      } catch (err) {
        console.warn("Weather cache write failed:", err.message);
      }

      return Response.json(formatted);
    }

    // ----------------------------------------------------------
    // FALLBACK — ALWAYS JSON
    // ----------------------------------------------------------
    return Response.json({ error: "Weather route not found" }, { status: 404 });

  } catch (err) {
    // NEVER return HTML — always JSON
    return Response.json({ error: "Worker crashed", details: err.message }, { status: 500 });
  }
}
