// ============================================================
// REAL TREE GUY OS — WEATHER (FINAL CLEAN VERSION)
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

// API wrapper
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
  userLabel: document.getElementById("rtgUserLabel"),
  locationLabel: document.getElementById("rtgLocationLabel"),
  conditionLabel: document.getElementById("rtgConditionLabel"),

  useGPSBtn: document.getElementById("useGPS"),
  setManualBtn: document.getElementById("setManual"),
  locationStatus: document.getElementById("locationStatus"),
  manualLat: document.getElementById("manualLat"),
  manualLon: document.getElementById("manualLon"),
  manualAddress: document.getElementById("manualAddress"),
  manualAddressBtn: document.getElementById("manualAddressBtn"),

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

  hourlyStrip: document.getElementById("hourlyStrip"),
  dailyStrip: document.getElementById("dailyStrip"),

  windSpeed: document.getElementById("windSpeed"),
  windGust: document.getElementById("windGust"),
  windDir: document.getElementById("windDir"),
  gustRatio: document.getElementById("gustRatio"),

  pressure: document.getElementById("pressure"),
  pressureTrend: document.getElementById("pressureTrend"),

  stormRisk: document.getElementById("stormRisk"),
  stormNotes: document.getElementById("stormNotes"),
  stormTicker: document.getElementById("stormTicker"),

  hazardScore: document.getElementById("hazardScore"),
  hazardNotes: document.getElementById("hazardNotes"),
  hazardTicker: document.getElementById("hazardTicker"),

  radarFrame: document.getElementById("rtgRadar")
};

// GET LOCATION (User → DB → GPS fallback)
async function getLocation() {
  try {
    const userLoc = await API.get(`/location?user=${rtgUserId}`);
    if (userLoc?.lat && userLoc?.lon) {
      return { lat: userLoc.lat, lon: userLoc.lon };
    }
  } catch {}

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 34.0, lon: -84.0 }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// HEADER UPDATE
function updateHeader(data) {
  const loc = data.location || {};
  const cur = data.current || {};

  el.userLabel.textContent = rtgUserName;
  el.locationLabel.textContent = loc.name || `${loc.lat}, ${loc.lon}`;
  el.conditionLabel.textContent = codeToText(cur.code);
}

// CURRENT CONDITIONS
function renderCurrent(data) {
  const w = data.current;

  el.currentTemp.textContent = `${w.temperature}°F`;
  el.currentWind.textContent = `Wind: ${w.wind} mph`;
  el.currentGust.textContent = `Gusts: ${w.gust} mph`;
  el.currentPressure.textContent = `Pressure: ${w.pressure} mb`;
  el.currentRain.textContent = `Rain: ${w.rain} in`;
  el.currentHumidity.textContent = `Humidity: ${w.humidity}%`;
  el.currentFeelsLike.textContent = `Feels Like: ${w.feels_like}°F`;
  el.currentDewpoint.textContent = `Dewpoint: ${w.dewpoint}°F`;

  const visMiles = w.visibility ? (w.visibility / 1609.34).toFixed(1) : "--";
  el.currentVisibility.textContent = `Visibility: ${visMiles} mi`;

  el.currentUV.textContent = `UV Index: ${w.uv_index}`;
}

// HOURLY FORECAST (correct current hour)
function renderHourly(data) {
  el.hourlyStrip.innerHTML = "";

  const hourly = data.hourly;
  const nowHour = new Date().getHours();

  let startIndex = hourly.findIndex(h => {
    const hour = parseInt(h.time.split(":")[0], 10);
    return hour === nowHour;
  });

  if (startIndex < 0) startIndex = 0;

  const nextHours = hourly.slice(startIndex, startIndex + 12);

  for (const h of nextHours) {
    el.hourlyStrip.innerHTML += `
      <div class="hour-card">
        <div class="h-time">${h.time}</div>
        <div class="h-temp">${h.temp}°</div>
        <div class="h-cond">${codeToText(h.code)}</div>
      </div>
    `;
  }
}

// DAILY FORECAST
function renderDaily(data) {
  el.dailyStrip.innerHTML = "";

  for (const d of data.daily) {
    el.dailyStrip.innerHTML += `
      <div class="day-card">
        <div class="d-day">${d.day}</div>
        <div class="d-temp">${d.hi}° / ${d.lo}°</div>
        <div class="d-cond">${codeToText(d.code)}</div>
      </div>
    `;
  }
}

// INTELLIGENCE MODULES
function renderIntelligence(data) {
  const cur = data.current;
  const hourly = data.hourly;
  const storm = data.storm;
  const hazard = data.hazard;

  // Wind
  el.windSpeed.textContent = `${cur.wind} mph`;
  el.windGust.textContent = `${cur.gust} mph`;
  el.windDir.textContent = "--"; // worker does not provide direction
  el.gustRatio.textContent =
    cur.wind && cur.gust ? (cur.gust / cur.wind).toFixed(2) : "--";

  // Pressure
  el.pressure.textContent = `${cur.pressure} mb`;

  let trend = "--";
  if (hourly.length >= 4) {
    const p0 = hourly[0].pressure;
    const p3 = hourly[3].pressure;
    if (p0 && p3) {
      trend = p3 > p0 ? "Rising" : p3 < p0 ? "Falling" : "Steady";
    }
  }
  el.pressureTrend.textContent = trend;

  // Storm Risk
  el.stormRisk.textContent = storm.level;
  el.stormNotes.textContent = storm.notes;

  el.stormTicker.textContent =
    storm.level === "Extreme"
      ? "Extreme storm risk — high chance of damage."
      : storm.level === "High"
      ? "High storm risk — stay ready for emergency calls."
      : storm.level === "Moderate"
      ? "Moderate storm risk — monitor conditions."
      : "Low storm risk — normal operations.";

  // Tree Hazard
  el.hazardScore.textContent = hazard.score;
  el.hazardNotes.textContent = hazard.notes;

  el.hazardTicker.textContent =
    hazard.level === "Critical"
      ? "Critical tree hazard — expect significant failures."
      : hazard.level === "Risk"
      ? "Elevated tree hazard — limbs and uproots likely."
      : hazard.level === "Watch"
      ? "Tree stress possible — monitor conditions."
      : "Trees stable — normal operations.";
}

// MAIN WEATHER LOADER
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
    `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
}

// ADDRESS SEARCH
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
    `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
}

// AUTO‑LOAD
async function initWeather() {
  const { lat, lon } = await getLocation();
  await loadWeatherByLatLon(lat, lon);
}

initWeather();
setInterval(initWeather, 5 * 60 * 1000);

// BUTTONS
el.useGPSBtn.addEventListener("click", async () => {
  const { lat, lon } = await getLocation();
  loadWeatherByLatLon(lat, lon);
});

el.setManualBtn.addEventListener("click", async () => {
  const lat = parseFloat(el.manualLat.value);
  const lon = parseFloat(el.manualLon.value);

  if (!isNaN(lat) && !isNaN(lon)) {
    loadWeatherByLatLon(lat, lon);
  } else {
    el.locationStatus.textContent = "Invalid coordinates.";
  }
});

el.manualAddressBtn.addEventListener("click", async () => {
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
