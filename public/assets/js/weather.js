// ============================================================
// REAL TREE GUY OS — WEATHER (FINAL CLEAN VERSION)
// ============================================================

const API_BASE = "/api";

// Logged‑in user identity
const rtgUserEmail = localStorage.getItem("rtgUserEmail");
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
      headers: { Accept: "application/json" }
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Weather request failed");
    return data;
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

  radarFrame: document.getElementById("rtgRadar")
};

// GET LOCATION
async function getLocation() {
  if (!navigator.geolocation) throw new Error("GPS is not available. Enter a location instead.");
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error("Could not access GPS. Enter a location instead.")),
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
  const value = (v, unit) => v == null ? "--" : `${v}${unit}`;

  el.currentTemp.textContent = value(w.temperature, "°F");
  el.currentWind.textContent = `Wind: ${value(w.wind, " mph")}`;
  el.currentGust.textContent = `Gusts: ${value(w.gust, " mph")}`;
  el.currentPressure.textContent = `Pressure: ${value(w.pressure, " mb")}`;
  el.currentRain.textContent = `Rain: ${value(w.rain, " in")}`;
  el.currentHumidity.textContent = `Humidity: ${value(w.humidity, "%")}`;
  el.currentFeelsLike.textContent = `Feels Like: ${value(w.feels_like, "°F")}`;
  el.currentDewpoint.textContent = `Dewpoint: ${value(w.dewpoint, "°F")}`;

  const visMiles = w.visibility != null ? (w.visibility / 1609.34).toFixed(1) : "--";
  el.currentVisibility.textContent = `Visibility: ${visMiles} mi`;

  el.currentUV.textContent = `UV Index: ${w.uv_index ?? "--"}`;
}

// HOURLY FORECAST (correct current hour)
function renderHourly(data) {
  el.hourlyStrip.innerHTML = "";

  for (const h of data.hourly) {
    el.hourlyStrip.innerHTML += `
      <div class="hour-card">
        <div class="h-time">${h.time.split("T")[1]}</div>
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

  // Wind
  el.windSpeed.textContent = cur.wind == null ? "--" : `${cur.wind} mph`;
  el.windGust.textContent = cur.gust == null ? "--" : `${cur.gust} mph`;
  el.windDir.textContent = cur.direction == null ? "--" : `${cur.direction}°`;
  el.gustRatio.textContent =
    cur.wind && cur.gust ? (cur.gust / cur.wind).toFixed(2) : "--";

  // Pressure
  el.pressure.textContent = cur.pressure == null ? "--" : `${cur.pressure} mb`;

  let trend = "--";
  if (hourly.length >= 4) {
    const p0 = hourly[0].pressure;
    const p3 = hourly[3].pressure;
    if (p0 != null && p3 != null) {
      trend = p3 > p0 ? "Rising" : p3 < p0 ? "Falling" : "Steady";
    }
  }
  el.pressureTrend.textContent = trend;

}

// MAIN WEATHER LOADER
let selectedLocation;
async function loadWeatherByLatLon(lat, lon) {
  el.locationStatus.textContent = "Loading weather…";

  const data = await API.get(`?lat=${lat}&lon=${lon}`);

  updateHeader(data);
  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);
  renderIntelligence(data);
  selectedLocation = { lat, lon };

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
  selectedLocation = { lat, lon };

  el.locationStatus.textContent =
    `Weather updated for ${lat.toFixed(3)}, ${lon.toFixed(3)} (${address})`;

  el.radarFrame.src =
    `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
}

// AUTO‑LOAD
async function initWeather() {
  try {
    const { lat, lon } = selectedLocation || await getLocation();
    await loadWeatherByLatLon(lat, lon);
  } catch (error) {
    console.error("Weather load failed:", error);
    el.locationStatus.textContent = error.message || "Could not load weather.";
  }
}

initWeather();
setInterval(initWeather, 5 * 60 * 1000);

// BUTTONS
el.useGPSBtn.addEventListener("click", async () => {
  try {
    const { lat, lon } = await getLocation();
    await loadWeatherByLatLon(lat, lon);
  } catch (error) {
    console.error("GPS weather failed:", error);
    el.locationStatus.textContent = error.message || "Could not load weather.";
  }
});

el.setManualBtn.addEventListener("click", async () => {
  const lat = parseFloat(el.manualLat.value);
  const lon = parseFloat(el.manualLon.value);

  if (Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
      Number.isFinite(lon) && lon >= -180 && lon <= 180) {
    try {
      await loadWeatherByLatLon(lat, lon);
    } catch (error) {
      console.error("Weather load failed:", error);
      el.locationStatus.textContent = error.message || "Could not load weather.";
    }
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
  } catch (error) {
    console.error("Address weather failed:", error);
    el.locationStatus.textContent = error.message || "Could not load weather for that address.";
  }
});
