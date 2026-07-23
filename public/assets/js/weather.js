// ============================================================
// REAL TREE GUY OS — WEATHER (USER-CENTRIC, DETAILED, FIXED)
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api";

// Logged‑in user identity
const rtgUserId = localStorage.getItem("rtgUserId");
const rtgUserEmail = localStorage.getItem("rtgUserEmail");
const rtgUserType = localStorage.getItem("rtgUserType");
const rtgUserName =
  localStorage.getItem("rtgUserName") || rtgUserEmail || "Tree Guy";

// WEATHER CODE → TEXT + EMOJI
function codeToText(code) {
  const map = {
    0: "☀️ Clear",
    1: "🌤 Mostly Clear",
    2: "⛅ Partly Cloudy",
    3: "☁️ Cloudy",
    45: "🌫 Fog",
    48: "🌫 Dense Fog",
    51: "🌦 Light Drizzle",
    53: "🌦 Drizzle",
    55: "🌧 Heavy Drizzle",
    61: "🌧 Light Rain",
    63: "🌧 Rain",
    65: "🌧 Heavy Rain",
    71: "🌨 Light Snow",
    73: "🌨 Snow",
    75: "❄️ Heavy Snow",
    80: "🌦 Rain Showers",
    81: "🌧 Heavy Showers",
    95: "⛈ Thunderstorms",
    99: "⛈ Severe Thunderstorms"
  };
  return map[code] || "🌍 Unknown";
}

// API wrapper with full headers
const API = {
  async get(path) {
    const r = await fetch(`${API_BASE}/weather${path}`, {
      headers: {
        Accept: "application/json",
        "X-RTG-User": rtgUserId,
        "X-RTG-Email": rtgUserEmail,
        "X-RTG-Type": rtgUserType
      }
    });

    const text = await r.text();
    if (text.trim().startsWith("<")) {
      throw new Error("Weather API returned HTML");
    }
    return JSON.parse(text);
  }
};

// DOM ELEMENTS
const el = {
  // header
  userLabel: document.getElementById("rtgUserLabel"),
  locationLabel: document.getElementById("rtgLocationLabel"),
  conditionLabel: document.getElementById("rtgConditionLabel"),

  // controls
  useGPSBtn: document.getElementById("useGPS"),
  setManualBtn: document.getElementById("setManual"),
  locationStatus: document.getElementById("locationStatus"),
  manualLat: document.getElementById("manualLat"),
  manualLon: document.getElementById("manualLon"),
  manualAddress: document.getElementById("manualAddress"),
  manualAddressBtn: document.getElementById("manualAddressBtn"),

  // current
  currentTemp: document.getElementById("currentTemp"),
  currentWind: document.getElementById("currentWind"),
  currentGust: document.getElementById("currentGust"),
  currentPressure: document.getElementById("currentPressure"),
  currentRain: document.getElementById("currentRain"),
  currentHumidity: document.getElementById("currentHumidity"),
  currentFeelsLike: document.getElementById("currentFeelsLike"),
  currentDewpoint: document.getElementById("currentDewpoint"),
  currentVisibility: document.getElementById("currentVisibility"),
  currentUV: document.getElementById("currentUV"),

  // strips
  hourlyStrip: document.getElementById("hourlyStrip"),
  dailyStrip: document.getElementById("dailyStrip"),

  // risk / hazard
  stormTicker: document.getElementById("stormTicker"),
  hazardTicker: document.getElementById("hazardTicker"),
  windSpeed: document.getElementById("windSpeed"),
  windGust: document.getElementById("windGust"),
  windDir: document.getElementById("windDir"),
  gustRatio: document.getElementById("gustRatio"),
  pressure: document.getElementById("pressure"),
  pressureTrend: document.getElementById("pressureTrend"),
  stormRisk: document.getElementById("stormRisk"),
  stormNotes: document.getElementById("stormNotes"),
  hazardScore: document.getElementById("hazardScore"),
  hazardNotes: document.getElementById("hazardNotes"),

  // radar
  radarFrame: document.getElementById("rtgRadar")
};

// GET LOCATION (User → DB → GPS fallback)
async function getLocation() {
  try {
    const userLoc = await API.get(`/location?user=${rtgUserId}`);
    if (userLoc?.lat && userLoc?.lon) {
      return { lat: userLoc.lat, lon: userLoc.lon };
    }
  } catch {
    console.warn("Saved location missing, using GPS.");
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 34.0, lon: -84.0 }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// UPDATE HEADER (user + location + condition)
function updateHeader(data) {
  const loc = data.location || {};
  const current = data.current || {};

  if (el.userLabel) el.userLabel.textContent = rtgUserName;

  if (el.locationLabel) {
    el.locationLabel.textContent =
      loc.name ||
      (loc.lat != null && loc.lon != null
        ? `${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}`
        : "Unknown location");
  }

  if (el.conditionLabel) {
    el.conditionLabel.textContent = codeToText(current.code);
  }
}

// RENDER CURRENT CONDITIONS
function renderCurrent(data) {
  const w = data.current;

  el.currentTemp.textContent =
    w.temperature != null ? `${w.temperature}°F` : "--°F";
  el.currentWind.textContent = `Wind: ${
    w.wind != null ? `${w.wind} mph` : "--"
  }`;
  el.currentGust.textContent = `Gusts: ${
    w.gust != null ? `${w.gust} mph` : "--"
  }`;
  el.currentPressure.textContent = `Pressure: ${
    w.pressure != null ? `${w.pressure} mb` : "--`
  }`;
  el.currentRain.textContent = `Rain: ${
    w.rain != null ? `${w.rain} in` : "--`
  }`;

  el.currentHumidity.textContent = `Humidity: ${
    w.humidity != null ? `${w.humidity}%` : "--"
  }`;
  el.currentFeelsLike.textContent = `Feels Like: ${
    w.feels_like != null ? `${w.feels_like}°F` : "--"
  }`;
  el.currentDewpoint.textContent = `Dewpoint: ${
    w.dewpoint != null ? `${w.dewpoint}°F` : "--"
  }`;

  const visMiles =
    w.visibility != null ? (w.visibility / 1609.34).toFixed(1) : null;
  el.currentVisibility.textContent = `Visibility: ${
    visMiles != null ? `${visMiles} mi` : "--"
  }`;

  el.currentUV.textContent = `UV Index: ${
    w.uv_index != null ? w.uv_index : "--"
  }`;
}

// RENDER HOURLY FORECAST (start at current hour)
function renderHourly(data) {
  el.hourlyStrip.innerHTML = "";

  const hourly = data.hourly || [];
  if (!hourly.length) return;

  const now = new Date();
  const currentHour = now.getHours();

  let startIndex = hourly.findIndex(h => {
    const hour = parseInt(h.time.split(":")[0], 10);
    return hour === currentHour;
  });
  if (startIndex < 0) startIndex = 0;

  const nextHours = hourly.slice(startIndex, startIndex + 12);

  for (const h of nextHours) {
    el.hourlyStrip.innerHTML += `
      <div class="hour-card">
        <div class="h-time">${h.time}</div>
        <div class="h-temp">${h.temp != null ? `${h.temp}°` : "--"}</div>
        <div class="h-cond">${codeToText(h.code)}</div>
      </div>
    `;
  }
}

// RENDER DAILY FORECAST
function renderDaily(data) {
  el.dailyStrip.innerHTML = "";

  const daily = data.daily || [];
  for (const d of daily) {
    el.dailyStrip.innerHTML += `
      <div class="day-card">
        <div class="d-day">${d.day}</div>
        <div class="d-temp">${
          d.hi != null ? `${d.hi}°` : "--"
        } / ${d.lo != null ? `${d.lo}°` : "--"}</div>
        <div class="d-cond">${codeToText(d.code)}</div>
      </div>
    `;
  }
}

// RENDER WIND / PRESSURE / RISK / HAZARD
function renderIntelligence(data) {
  const cur = data.current || {};
  const hourly = data.hourly || [];
  const storm = data.storm || {};
  const hazard = data.hazard || {};

  // Wind Intelligence
  if (el.windSpeed)
    el.windSpeed.textContent =
      cur.wind != null ? `${cur.wind} mph` : "--";
  if (el.windGust)
    el.windGust.textContent =
      cur.gust != null ? `${cur.gust} mph` : "--";

  // Direction not provided by worker yet → placeholder
  if (el.windDir) el.windDir.textContent = "--";

  if (el.gustRatio) {
    if (cur.wind && cur.gust) {
      el.gustRatio.textContent = (cur.gust / cur.wind).toFixed(2);
    } else {
      el.gustRatio.textContent = "--";
    }
  }

  // Pressure + trend
  if (el.pressure)
    el.pressure.textContent =
      cur.pressure != null ? `${cur.pressure} mb` : "--`;

  let trend = "--";
  if (hourly.length >= 4) {
    const p0 = hourly[0].pressure;
    const p3 = hourly[3].pressure;
    if (p0 != null && p3 != null) {
      trend = p3 > p0 ? "Rising" : p3 < p0 ? "Falling" : "Steady";
    }
  }
  if (el.pressureTrend) el.pressureTrend.textContent = trend;

  // Storm Risk
  if (el.stormRisk) el.stormRisk.textContent = storm.level || "--";
  if (el.stormNotes) el.stormNotes.textContent = storm.notes || "--";

  if (el.stormTicker) {
    el.stormTicker.textContent =
      storm.level === "Extreme"
        ? "⛈ Extreme storm risk — high chance of damage."
        : storm.level === "High"
        ? "🌩 High storm risk — stay ready for emergency calls."
        : storm.level === "Moderate"
        ? "🌦 Moderate storm risk — monitor conditions."
        : "🌤 Low storm risk — normal operations.";
  }

  // Tree Hazard
  if (el.hazardScore)
    el.hazardScore.textContent =
      hazard.score != null ? hazard.score : "--";
  if (el.hazardNotes) el.hazardNotes.textContent = hazard.notes || "--";

  if (el.hazardTicker) {
    el.hazardTicker.textContent =
      hazard.level === "Critical"
        ? "🌲⚠️ Critical tree hazard — expect significant failures."
        : hazard.level === "Risk"
        ? "🌲⚠️ Elevated tree hazard — limbs and uproots likely."
        : hazard.level === "Watch"
        ? "🌲 Watch — some trees may be stressed."
        : "🌲 Stable — trees generally holding.";
  }
}

// MAIN WEATHER LOADER (lat/lon)
async function loadWeatherByLatLon(lat, lon) {
  el.locationStatus.textContent = "Loading weather…";

  const data = await API.get(`?lat=${lat}&lon=${lon}`);

  updateHeader(data);
  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);
  renderIntelligence(data);

  el.locationStatus.textContent =
    `Weather updated for ${lat.toFixed(3)}, ${lon.toFixed(3)}`;

  el.radarFrame.src =
    `https://www.rainviewer.com/map.html?loc=${lat},${lon},8` +
    `&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
}

// LOAD BY ADDRESS (any place)
async function loadWeatherByAddress(address) {
  el.locationStatus.textContent = `Looking up "${address}"…`;

  const data = await API.get(`?address=${encodeURIComponent(address)}`);

  updateHeader(data);
  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);
  renderIntelligence(data);

  const { lat, lon } = data.location;
  el.locationStatus.textContent =
    `Weather updated for ${lat.toFixed(3)}, ${lon.toFixed(3)} (${address})`;

  el.radarFrame.src =
    `https://www.rainviewer.com/map.html?loc=${lat},${lon},8` +
    `&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
}

// AUTO‑LOAD
async function initWeather() {
  const { lat, lon } = await getLocation();
  await loadWeatherByLatLon(lat, lon);
}

initWeather();
setInterval(initWeather, 5 * 60 * 1000);

// BUTTON: USE GPS / saved location
el.useGPSBtn?.addEventListener("click", async () => {
  const { lat, lon } = await getLocation();
  loadWeatherByLatLon(lat, lon);
});

// BUTTON: MANUAL LAT/LON
el.setManualBtn?.addEventListener("click", async () => {
  const lat = parseFloat(el.manualLat.value);
  const lon = parseFloat(el.manualLon.value);

  if (!isNaN(lat) && !isNaN(lon)) {
    loadWeatherByLatLon(lat, lon);
  } else {
    el.locationStatus.textContent = "Invalid coordinates.";
  }
});

// BUTTON: ADDRESS SEARCH
el.manualAddressBtn?.addEventListener("click", async () => {
  const addr = el.manualAddress.value.trim();
  if (!addr) {
    el.locationStatus.textContent = "Enter a city or address.";
    return;
  }
  try {
    await loadWeatherByAddress(addr);
  } catch {
    el.locationStatus.textContent = "Could not load weather for that address.";
  }
});
