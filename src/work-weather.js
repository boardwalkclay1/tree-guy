// ============================================================
// REAL TREE GUY OS — WEATHER WORKER (CINEMATIC, FULL METRICS)
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
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}`;

    const res = await fetch(geoUrl, {
      headers: { "User-Agent": "RealTreeGuyOS/1.0" }
    });

    const data = await res.json();
    if (!data.length) return null;

    const best = data[0];
    const addr = best.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.county ||
      "";
    const state = addr.state || addr.region || "";
    const country = addr.country || "";

    return {
      lat: parseFloat(best.lat),
      lon: parseFloat(best.lon),
      name: [city, state || country].filter(Boolean).join(", ")
    };
  }

  // ============================================================
  // REVERSE GEOCODE (coords → name)
// ============================================================
  async function reverseGeocode(lat, lon) {
    const revUrl =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    const res = await fetch(revUrl, {
      headers: { "User-Agent": "RealTreeGuyOS/1.0" }
    });

    const data = await res.json();
    const addr = data.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.county ||
      "";
    const state = addr.state || addr.region || "";
    const country = addr.country || "";

    return [city, state || country].filter(Boolean).join(", ");
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

    let locationName = null;

    // Address lookup
    if (address) {
      const coords = await geocode(address);
      if (!coords) return json({ error: "Address not found" }, 404);
      lat = coords.lat;
      lon = coords.lon;
      locationName = coords.name;
    }

    lat = parseFloat(lat);
    lon = parseFloat(lon);

    if (isNaN(lat) || isNaN(lon)) {
      return json({ error: "Missing lat/lon or address" }, 400);
    }

    if (!locationName) {
      try {
        locationName = await reverseGeocode(lat, lon);
      } catch {
        locationName = null;
      }
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
    // FETCH FROM OPEN-METEO (FULL METRICS)
// ----------------------------------------------------------
    let raw;
    try {
      const wxUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&hourly=temperature_2m,apparent_temperature,relativehumidity_2m,dewpoint_2m,weathercode,` +
        `windgusts_10m,precipitation,surface_pressure,visibility,uv_index` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
        `&temperature_unit=fahrenheit&timezone=auto`;

      const res = await fetch(wxUrl);
      const text = await res.text();
      raw = JSON.parse(text);
    } catch (err) {
      return json({ error: "Weather API failed", details: err.message }, 500);
    }

    // ----------------------------------------------------------
    // SAFETY GUARDS
    // ----------------------------------------------------------
    const cur = raw.current_weather || {};
    const hourly = raw.hourly || {};
    const daily = raw.daily || {};

    // Use first hourly index for extra current metrics
    const h0 = 0;

    const currentTemp = cur.temperature;
    const currentFeels = hourly.apparent_temperature?.[h0] ?? null;
    const currentHumidity = hourly.relativehumidity_2m?.[h0] ?? null;
    const currentDew = hourly.dewpoint_2m?.[h0] ?? null;
    const currentVis = hourly.visibility?.[h0] ?? null;
    const currentUV = hourly.uv_index?.[h0] ?? null;
    const currentPressure = hourly.surface_pressure?.[h0] ?? null;
    const currentRain = hourly.precipitation?.[h0] ?? null;
    const currentGust = hourly.windgusts_10m?.[h0] ?? null;

    // ----------------------------------------------------------
    // DERIVED RISK / HAZARD
    // ----------------------------------------------------------
    function computeStormRisk(code, wind, gust, rain) {
      let score = 0;

      if (wind >= 25) score += 2;
      if (gust >= 35) score += 3;
      if (rain >= 0.25) score += 2;

      const severeCodes = [80, 81, 95, 99];
      if (severeCodes.includes(code)) score += 4;

      let level = "Low";
      let notes = "Normal operations.";

      if (score >= 3 && score < 6) {
        level = "Moderate";
        notes = "Monitor storms and wind for tree stress.";
      } else if (score >= 6 && score < 9) {
        level = "High";
        notes = "Elevated storm risk. Be ready for emergency calls.";
      } else if (score >= 9) {
        level = "Extreme";
        notes = "Severe conditions likely. High chance of tree damage.";
      }

      return { level, notes, score };
    }

    function computeTreeHazard(wind, gust, soilWetness) {
      // soilWetness ~ rain proxy
      let score = 0;

      if (wind >= 20) score += 2;
      if (gust >= 30) score += 3;
      if (soilWetness >= 0.2) score += 2;

      let level = "Stable";
      let notes = "Trees generally stable.";

      if (score >= 3 && score < 6) {
        level = "Watch";
        notes = "Some shallow-rooted trees may be stressed.";
      } else if (score >= 6 && score < 9) {
        level = "Risk";
        notes = "High chance of limb failures and uproots.";
      } else if (score >= 9) {
        level = "Critical";
        notes = "Extreme hazard. Expect significant tree damage.";
      }

      return { level, notes, score };
    }

    const storm = computeStormRisk(
      cur.weathercode ?? 0,
      cur.windspeed ?? 0,
      currentGust ?? 0,
      currentRain ?? 0
    );

    const hazard = computeTreeHazard(
      cur.windspeed ?? 0,
      currentGust ?? 0,
      currentRain ?? 0
    );

    // ----------------------------------------------------------
    // FORMAT WEATHER DATA
    // ----------------------------------------------------------
    const formatted = {
      location: {
        lat,
        lon,
        name: locationName
      },
      current: {
        temperature: currentTemp,
        feels_like: currentFeels,
        humidity: currentHumidity,
        dewpoint: currentDew,
        visibility: currentVis,
        uv_index: currentUV,
        wind: cur.windspeed,
        code: cur.weathercode,
        gust: currentGust,
        pressure: currentPressure,
        rain: currentRain
      },
      hourly: (hourly.time || []).map((t, i) => ({
        time: t.split("T")[1],
        temp: hourly.temperature_2m?.[i],
        feels_like: hourly.apparent_temperature?.[i],
        humidity: hourly.relativehumidity_2m?.[i],
        dewpoint: hourly.dewpoint_2m?.[i],
        code: hourly.weathercode?.[i],
        gust: hourly.windgusts_10m?.[i],
        rain: hourly.precipitation?.[i],
        pressure: hourly.surface_pressure?.[i],
        visibility: hourly.visibility?.[i],
        uv_index: hourly.uv_index?.[i]
      })),
      daily: (daily.time || []).map((d, i) => ({
        day: d,
        hi: daily.temperature_2m_max?.[i],
        lo: daily.temperature_2m_min?.[i],
        code: daily.weathercode?.[i]
      })),
      storm: {
        level: storm.level,
        notes: storm.notes,
        score: storm.score
      },
      hazard: {
        level: hazard.level,
        notes: hazard.notes,
        score: hazard.score
      }
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
