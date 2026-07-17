// ============================================================
// REAL TREE GUY — WEATHER WORKER (FINAL FIXED VERSION)
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;

  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // ----------------------------------------------------------
    // WEATHER FETCH (NO PROFILE, NO USER ID — JUST WEATHER)
    // ----------------------------------------------------------
    if (path === "/api/weather" && request.method === "GET") {
      const lat = parseFloat(url.searchParams.get("lat"));
      const lon = parseFloat(url.searchParams.get("lon"));

      if (isNaN(lat) || isNaN(lon)) {
        return Response.json({ error: "Missing lat/lon" }, { status: 400 });
      }

      const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

      // Try cache safely
      try {
        const cached = await DB.prepare(
          "SELECT data, ts FROM weather_cache WHERE key = ?"
        ).bind(cacheKey).first();

        if (cached) {
          const age = Date.now() - cached.ts;
          if (age < 5 * 60 * 1000) {
            return Response.json(JSON.parse(cached.data));
          }
        }
      } catch (err) {
        console.warn("Cache read failed:", err.message);
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
        const text = await res.text();

        // Prevent "<!DOCTYPE" crash
        try {
          raw = JSON.parse(text);
        } catch {
          return Response.json(
            { error: "Weather API returned non‑JSON", raw: text.slice(0, 200) },
            { status: 502 }
          );
        }
      } catch (err) {
        return Response.json(
          { error: "Weather API failed", details: err.message },
          { status: 500 }
        );
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
        console.warn("Cache write failed:", err.message);
      }

      return Response.json(formatted);
    }

    // ----------------------------------------------------------
    // FALLBACK — ALWAYS JSON
    // ----------------------------------------------------------
    return Response.json({ error: "Weather route not found" }, { status: 404 });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
