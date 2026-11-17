async function lookupAddress(address) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    limit: "1",
    q: address
  });
  const response = await fetch(url, {
    headers: { "User-Agent": "RealTreeGuyOS/1.0" },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error("Location service unavailable");
  const results = await response.json();
  if (!Array.isArray(results)) throw new Error("Invalid location service response");
  if (!results.length) return null;
  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
    name: results[0].display_name
  };
}

export async function handle(request) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/weather" || request.method !== "GET") {
    return Response.json({ error: "Weather route not found" }, { status: 404 });
  }

  try {
    const address = url.searchParams.get("address")?.trim();
    let location;
    if (address) {
      if (address.length > 200) {
        return Response.json({ error: "Address is too long" }, { status: 400 });
      }
      location = await lookupAddress(address);
      if (!location) return Response.json({ error: "Location not found" }, { status: 404 });
    } else {
      const lat = url.searchParams.get("lat");
      const lon = url.searchParams.get("lon");
      if (lat === null || lon === null || !lat.trim() || !lon.trim()) {
        return Response.json({ error: "Enter a location or coordinates" }, { status: 400 });
      }
      location = { lat: Number(lat), lon: Number(lon), name: null };
    }

    const { lat, lon } = location;
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const forecast = new URL("https://api.open-meteo.com/v1/forecast");
    forecast.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,surface_pressure,uv_index",
      hourly: "temperature_2m,weather_code,surface_pressure,visibility",
      daily: "temperature_2m_max,temperature_2m_min,weather_code",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      precipitation_unit: "inch",
      timezone: "auto"
    });
    const response = await fetch(forecast, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Weather service unavailable");
    const raw = await response.json();
    if (!raw.current || !Array.isArray(raw.hourly?.time) || !Array.isArray(raw.daily?.time)) {
      throw new Error("Invalid weather service response");
    }
    const currentHour = raw.current.time.slice(0, 13);
    const start = raw.hourly.time.findIndex(time => time.slice(0, 13) === currentHour);
    if (start < 0) throw new Error("Current forecast hour is unavailable");
    const current = raw.current;
    const hourly = raw.hourly.time.slice(start, start + 12).map((time, offset) => {
      const i = start + offset;
      return {
        time,
        temp: raw.hourly.temperature_2m?.[i],
        code: raw.hourly.weather_code?.[i],
        pressure: raw.hourly.surface_pressure?.[i]
      };
    });
    return Response.json({
      location,
      current: {
        temperature: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        dewpoint: current.dew_point_2m,
        visibility: raw.hourly.visibility?.[start],
        uv_index: current.uv_index,
        wind: current.wind_speed_10m,
        direction: current.wind_direction_10m,
        code: current.weather_code,
        gust: current.wind_gusts_10m,
        pressure: current.surface_pressure,
        rain: current.precipitation
      },
      hourly,
      daily: raw.daily.time.map((day, i) => ({
        day,
        hi: raw.daily.temperature_2m_max?.[i],
        lo: raw.daily.temperature_2m_min?.[i],
        code: raw.daily.weather_code?.[i]
      }))
    });
  } catch (error) {
    console.error("Weather request failed:", error);
    return Response.json({ error: "Weather or location service is unavailable. Please try again." }, { status: 502 });
  }
}
