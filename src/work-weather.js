// ============================================================
// REAL TREE GUY — WEATHER WORKER (D1 + Open‑Meteo)
// ============================================================

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const DB = env.DB;

  // GET PROFILE LOCATION
  if (path === "/api/weather/profile" && request.method === "GET") {
    const { results } = await DB.prepare(
      "SELECT lat, lon FROM profile_location LIMIT 1"
    ).all();
    return Response.json(results?.[0] || {});
  }

  // SET PROFILE LOCATION
  if (path === "/api/weather/profile" && request.method === "POST") {
    const body = await request.json();
    await DB.prepare("DELETE FROM profile_location").run();
    await DB.prepare(
      "INSERT INTO profile_location (lat, lon) VALUES (?, ?)"
    ).bind(body.lat, body.lon).run();
    return Response.json({ ok: true });
  }

  // WEATHER FETCH
  if (path === "/api/weather" && request.method === "GET") {
    const lat = parseFloat(url.searchParams.get("lat"));
    const lon = parseFloat(url.searchParams.get("lon"));

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

    // Try cache
    const cached = await DB.prepare(
      "SELECT data, ts FROM weather_cache WHERE key = ?"
    ).bind(cacheKey).first();

    if (cached) {
      const age = Date.now() - cached.ts;
      if (age < 5 * 60 * 1000) {
        return Response.json(JSON.parse(cached.data));
      }
    }

    // Fetch from Open‑Meteo
    const wxUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true` +
      `&hourly=temperature_2m,weathercode,windgusts_10m,precipitation,surface_pressure` +
      `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
      `&temperature_unit=fahrenheit&timezone=auto`;

    const raw = await fetch(wxUrl).then(r => r.json());

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

    // Store cache
    await DB.prepare(
      "INSERT OR REPLACE INTO weather_cache (key, data, ts) VALUES (?, ?, ?)"
    ).bind(cacheKey, JSON.stringify(formatted), Date.now()).run();

    return Response.json(formatted);
  }

  return new Response("Weather route not found", { status: 404 });
}
