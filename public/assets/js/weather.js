// ============================================================
// REAL TREE GUY OS — WEATHER ENGINE (OPEN-METEO)
// ============================================================

// DOM TARGETS (your new HTML uses different IDs)
const useGPSBtn = document.getElementById("useGPS");
const setManualBtn = document.getElementById("setManual");
const locationStatus = document.getElementById("locationStatus");

const manualLat = document.getElementById("manualLat");
const manualLon = document.getElementById("manualLon");

// CURRENT CONDITIONS
const currentTemp = document.getElementById("currentTemp");
const currentWind = document.getElementById("currentWind");
const currentGust = document.getElementById("currentGust");
const currentPressure = document.getElementById("currentPressure");
const currentRain = document.getElementById("currentRain");

// FORECAST STRIPS
const hourlyStrip = document.getElementById("hourlyStrip");
const dailyStrip = document.getElementById("dailyStrip");

// OPEN-METEO API
const API = "https://api.open-meteo.com/v1/forecast";

// WEATHER CODE → TEXT
function codeToText(code) {
  const map = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Fog",
    51: "Light Drizzle",
    61: "Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Snow",
    95: "Thunderstorm"
  };
  return map[code] || "Weather";
}

// GET WEATHER
async function getWeather(lat, lon) {
  const url = `${API}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

// GET GPS WITH PERMISSION HANDLING
function getLocation() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      err => {
        console.warn("Location denied, using fallback.");
        locationStatus.textContent = "GPS denied — using fallback (Atlanta)";
        resolve({ lat: 34.0, lon: -84.0 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// RENDER CURRENT CONDITIONS
function renderCurrent(data) {
  const w = data.current_weather;

  currentTemp.textContent = `${w.temperature}°F`;
  currentWind.textContent = `Wind: ${w.windspeed} mph`;
  currentGust.textContent = `Gusts: ${w.windgusts ?? "--"} mph`;
  currentPressure.textContent = `Pressure: ${data.hourly?.surface_pressure?.[0] ?? "--"} mb`;
  currentRain.textContent = `Rain: ${data.hourly?.precipitation?.[0] ?? "--"} in`;
}

// RENDER HOURLY FORECAST (12 hours)
function renderHourly(data) {
  hourlyStrip.innerHTML = "";

  for (let i = 0; i < 12; i++) {
    const temp = data.hourly.temperature_2m[i];
    const code = data.hourly.weathercode[i];
    const time = data.hourly.time[i].split("T")[1];

    hourlyStrip.innerHTML += `
      <div class="hour-card">
        <div class="h-time">${time}</div>
        <div class="h-temp">${temp}°</div>
        <div class="h-cond">${codeToText(code)}</div>
      </div>
    `;
  }
}

// RENDER DAILY FORECAST (7 days)
function renderDaily(data) {
  dailyStrip.innerHTML = "";

  for (let i = 0; i < data.daily.time.length; i++) {
    const day = data.daily.time[i];
    const hi = data.daily.temperature_2m_max[i];
    const lo = data.daily.temperature_2m_min[i];
    const cond = codeToText(data.daily.weathercode[i]);

    dailyStrip.innerHTML += `
      <div class="day-card">
        <div class="d-day">${day}</div>
        <div class="d-temp">${hi}° / ${lo}°</div>
        <div class="d-cond">${cond}</div>
      </div>
    `;
  }
}

// MAIN LOADER
async function loadWeather(lat, lon) {
  locationStatus.textContent = "Loading weather…";

  const data = await getWeather(lat, lon);

  renderCurrent(data);
  renderHourly(data);
  renderDaily(data);

  locationStatus.textContent = `Weather updated for ${lat.toFixed(3)}, ${lon.toFixed(3)}`;

  // SYNC TO DASHBOARD
  localStorage.setItem("rtgWeatherToday", JSON.stringify(data.current_weather));
  localStorage.setItem("rtgWeatherForecast", JSON.stringify(data.daily));
}

// AUTO‑LOAD ON PAGE OPEN
(async () => {
  const { lat, lon } = await getLocation();
  loadWeather(lat, lon);
})();

// BUTTON: USE GPS
useGPSBtn.addEventListener("click", async () => {
  locationStatus.textContent = "Requesting GPS…";
  const { lat, lon } = await getLocation();
  loadWeather(lat, lon);
});

// BUTTON: MANUAL LOCATION
setManualBtn.addEventListener("click", () => {
  const lat = parseFloat(manualLat.value);
  const lon = parseFloat(manualLon.value);

  if (!isNaN(lat) && !isNaN(lon)) {
    locationStatus.textContent = "Using manual location…";
    loadWeather(lat, lon);
  } else {
    locationStatus.textContent = "Invalid coordinates.";
  }
});
