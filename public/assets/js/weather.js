// ============================================================
// REAL TREE GUY OS — WEATHER (WORKER + D1 VERSION)
// ============================================================

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

  wxIcon: document.getElementById("wxIcon"),
  wxLabel: document.getElementById("wxLabel"),
  radarFrame: document.getElementById("rtgRadar")
};

// API WRAPPER (calls your Worker)
const API = {
  async get(path) {
    const r = await fetch(path);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return r.json();
  }
};

// WEATHER CODE → TEXT
function codeToText(code) {
  const map = {
    0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Cloudy",
    45: "Fog", 48: "Fog", 51: "Light Drizzle", 61: "Rain",
    63: "Rain", 65: "Heavy Rain", 71: "Snow", 95: "Thunderstorm"
  };
  return map[code] || "Weather";
}

// WEATHER CODE → ICON CLASS
function iconClassForCode(code) {
  if (code <= 1) return "sunny";
  if (code <= 48) return "cloudy";
  if (code <= 67) return "rainy";
  if (code <= 77) return "snowy";
  if (code >= 95) return "stormy";
  return "cloudy";
}

// GET LOCATION (profile → GPS fallback)
async function getLocation() {
  const profile = await API.get("/api/weather/profile");

  if (profile.lat && profile.lon) {
    return { lat: profile.lat, lon: profile.lon };
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

  if (el.wxIcon && el.wxLabel) {
    el.wxIcon.className = "wx-icon " + iconClassForCode(w.code);
    el.wxLabel.textContent = codeToText(w.code);
  }
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

// MAIN LOADER
async function loadWeather(lat, lon) {
  el.locationStatus.textContent = "Loading weather…";

  const data = await API.get(`/api/weather?lat=${lat}&lon=${lon}`);

  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);

  el.locationStatus.textContent =
    `Weather updated for ${lat.toFixed(3)}, ${lon.toFixed(3)}`;

  if (el.radarFrame) {
    el.radarFrame.src =
      `https://www.rainviewer.com/map.html?loc=${lat},${lon},8` +
      `&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
  }
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
    await API.post("/api/weather/profile", { lat, lon });
    loadWeather(lat, lon);
  } else {
    el.locationStatus.textContent = "Invalid coordinates.";
  }
});
