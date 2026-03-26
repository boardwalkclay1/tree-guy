// ============================================================
// REAL TREE GUY OS — WEATHER ENGINE (OPEN-METEO)
// ============================================================

const weatherBox = document.getElementById("weatherBox");
const forecastRow = document.getElementById("forecastRow");

// OPEN-METEO (free, no key)
const API = "https://api.open-meteo.com/v1/forecast";

async function getWeather(lat, lng) {
  const url = `${API}?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

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

// GET GPS
function getLocation() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 34.0, lng: -84.0 }) // fallback ATL
    );
  });
}

// TODAY
function renderToday(data) {
  const w = data.current_weather;
  const text = codeToText(w.weathercode);

  weatherBox.innerHTML = `
    <div class="today-temp">${w.temperature}°F</div>
    <div class="today-cond">${text}</div>
  `;
}

// FORECAST
function renderForecast(data) {
  const days = data.daily;
  forecastRow.innerHTML = "";

  for (let i = 0; i < days.time.length; i++) {
    const day = days.time[i];
    const hi = days.temperature_2m_max[i];
    const lo = days.temperature_2m_min[i];
    const cond = codeToText(days.weathercode[i]);

    forecastRow.innerHTML += `
      <div class="forecast-card">
        <div class="f-day">${day}</div>
        <div class="f-temp">${hi}° / ${lo}°</div>
        <div class="f-cond">${cond}</div>
      </div>
    `;
  }
}

// MAIN
(async () => {
  const { lat, lng } = await getLocation();
  const data = await getWeather(lat, lng);

  renderToday(data);
  renderForecast(data);

  // SEND WEATHER TO DASHBOARD + CALENDAR
  localStorage.setItem("rtgWeatherToday", JSON.stringify(data.current_weather));
  localStorage.setItem("rtgWeatherForecast", JSON.stringify(data.daily));
})();
