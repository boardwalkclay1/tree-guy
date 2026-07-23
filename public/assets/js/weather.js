// ============================================================
// REAL TREE GUY OS — WEATHER (FINAL, ACCURATE USER LOCATION)
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api";

// Logged‑in user identity
const rtgUserId = localStorage.getItem("rtgUserId");
const rtgUserEmail = localStorage.getItem("rtgUserEmail");
const rtgUserType = localStorage.getItem("rtgUserType");

// WEATHER CODE → TEXT (REQUIRED)
function codeToText(code) {
  const map = {
    0: "Clear",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Dense Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    80: "Rain Showers",
    81: "Heavy Showers",
    95: "Thunderstorms",
    99: "Severe Thunderstorms"
  };
  return map[code] || "Unknown";
}

// API wrapper with full headers
const API = {
  async get(path) {
    const r = await fetch(`${API_BASE}/weather${path}`, {
      headers: {
        "Accept": "application/json",
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
  useGPSBtn: document.getElementById("useGPS"),
  setManualBtn: document.getElementById("setManual"),
  locationStatus: document.getElementById("locationStatus"),
  manualLat: document.getElementById("manualLat"),
  manualLon: document.getElementById("manualLon"),

  currentTemp: document.getElementById("currentTemp"),
  currentWind: document.getElementById("currentWind"),
  currentGust: document.getElementById("currentGust"),
  currentPressure: document.getElementById("currentPressure"),
  currentRain: document.getElementById("currentRain"),

  hourlyStrip: document.getElementById("hourlyStrip"),
  dailyStrip: document.getElementById("dailyStrip"),

  radarFrame: document.getElementById("rtgRadar")
};

// GET LOCATION (User → DB → GPS fallback)
async function getLocation() {
  try {
    const userLoc = await API.get(`/location?user=${rtgUserId}`);
    if (userLoc?.lat && userLoc?.lon) {
      return { lat: userLoc.lat, lon: userLoc.lon };
    }
  } catch (err) {
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

// RENDER CURRENT CONDITIONS
function renderCurrent(data) {
  const w = data.current;

  el.currentTemp.textContent = `${w.temperature}°F`;
  el.currentWind.textContent = `Wind: ${w.wind} mph`;
  el.currentGust.textContent = `Gusts: ${w.gust ?? "--"} mph`;
  el.currentPressure.textContent = `Pressure: ${w.pressure ?? "--"} mb`;
  el.currentRain.textContent = `Rain: ${w.rain ?? "--"} in`;
}

// RENDER HOURLY FORECAST
function renderHourly(data) {
  el.hourlyStrip.innerHTML = "";

  for (const h of data.hourly.slice(0, 12)) {
    el.hourlyStrip.innerHTML += `
      <div class="hour-card">
        <div class="h-time">${h.time}</div>
        <div class="h-temp">${h.temp}°</div>
        <div class="h-cond">${codeToText(h.code)}</div>
      </div>
    `;
  }
}

// RENDER DAILY FORECAST
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

// MAIN WEATHER LOADER
async function loadWeather(lat, lon) {
  el.locationStatus.textContent = "Loading weather…";

  const data = await API.get(`?lat=${lat}&lon=${lon}`);

  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);

  el.locationStatus.textContent =
    `Weather updated for ${lat.toFixed(3)}, ${lon.toFixed(3)}`;

  // RADAR
  el.radarFrame.src =
    `https://www.rainviewer.com/map.html?loc=${lat},${lon},8` +
    `&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
}

// AUTO‑LOAD
async function initWeather() {
  const { lat, lon } = await getLocation();
  await loadWeather(lat, lon);
}

initWeather();
setInterval(initWeather, 5 * 60 * 1000);

// BUTTON: USE GPS
el.useGPSBtn?.addEventListener("click", async () => {
  const { lat, lon } = await getLocation();
  loadWeather(lat, lon);
});

// BUTTON: MANUAL LOCATION
el.setManualBtn?.addEventListener("click", async () => {
  const lat = parseFloat(el.manualLat.value);
  const lon = parseFloat(el.manualLon.value);

  if (!isNaN(lat) && !isNaN(lon)) {
    loadWeather(lat, lon);
  } else {
    el.locationStatus.textContent = "Invalid coordinates.";
  }
});
