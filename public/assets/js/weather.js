// ============================================================
// REAL TREE GUY OS — WEATHER (USER-CENTRIC, DETAILED VERSION)
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api";

// Logged‑in user identity
const rtgUserId = localStorage.getItem("rtgUserId");
const rtgUserEmail = localStorage.getItem("rtgUserEmail");
const rtgUserType = localStorage.getItem("rtgUserType");
const rtgUserName = localStorage.getItem("rtgUserName") || rtgUserEmail || "Tree Guy";

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

  // radar
  radarFrame: document.getElementById("rtgRadar")
};

// REVERSE GEOCODE FOR DISPLAY LOCATION
async function getDisplayLocation(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": "RealTreeGuyOS/1.0" } }
    );
    const data = await res.json();
    const city =
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.hamlet ||
      "";
    const state = data.address.state || data.address.region || "";
    const country = data.address.country_code
      ? data.address.country_code.toUpperCase()
      : "";

    let label = "";
    if (city && state) label = `${city}, ${state}`;
    else if (state) label = state;
    else if (city) label = city;
    else label = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

    return { label, country };
  } catch {
    return { label: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, country: "" };
  }
}

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
async function updateHeader(data) {
  const { lat, lon } = data.location || { lat: null, lon: null };

  el.userLabel && (el.userLabel.textContent = rtgUserName);

  if (lat != null && lon != null) {
    const loc = await getDisplayLocation(lat, lon);
    if (el.locationLabel) {
      el.locationLabel.textContent = loc.label;
    }
  }

  const condText = codeToText(data.current.code);
  if (el.conditionLabel) {
    el.conditionLabel.textContent = condText;
  }
}

// RENDER CURRENT CONDITIONS (highly detailed)
function renderCurrent(data) {
  const w = data.current;

  el.currentTemp.textContent = `${w.temperature}°F`;
  el.currentWind.textContent = `Wind: ${w.wind} mph`;
  el.currentGust.textContent = `Gusts: ${w.gust ?? "--"} mph`;
  el.currentPressure.textContent = `Pressure: ${w.pressure ?? "--"} mb`;
  el.currentRain.textContent = `Rain: ${w.rain ?? "--"} in`;

  if (el.currentHumidity)
    el.currentHumidity.textContent = `Humidity: ${w.humidity ?? "--"}%`;
  if (el.currentFeelsLike)
    el.currentFeelsLike.textContent = `Feels like: ${w.feels_like ?? "--"}°F`;
  if (el.currentDewpoint)
    el.currentDewpoint.textContent = `Dewpoint: ${w.dewpoint ?? "--"}°F`;
  if (el.currentVisibility)
    el.currentVisibility.textContent = `Visibility: ${w.visibility ?? "--"} mi`;
  if (el.currentUV)
    el.currentUV.textContent = `UV Index: ${w.uv ?? "--"}`;
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
async function loadWeatherByLatLon(lat, lon) {
  el.locationStatus.textContent = "Loading weather…";

  const data = await API.get(`?lat=${lat}&lon=${lon}`);

  await updateHeader(data);
  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);

  el.locationStatus.textContent =
    `Weather updated for ${lat.toFixed(3)}, ${lon.toFixed(3)}`;

  el.radarFrame.src =
    `https://www.rainviewer.com/map.html?loc=${lat},${lon},8` +
    `&o=1&c=1&lm=1&layer=radar&sm=1&sn=1`;
}

// LOAD BY ADDRESS (any place in America)
async function loadWeatherByAddress(address) {
  el.locationStatus.textContent = `Looking up "${address}"…`;

  const data = await API.get(`?address=${encodeURIComponent(address)}`);

  await updateHeader(data);
  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);

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

// BUTTON: ADDRESS SEARCH (any US location)
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
