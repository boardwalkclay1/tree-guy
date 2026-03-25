// ============================================================
// REAL TREE GUY OS — DASHBOARD MODULE (WITH WEATHER)
// ============================================================

// tree buttons
document.querySelectorAll(".branch-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const href = btn.getAttribute("href");
    if (href) window.location.href = href;
  });
});

// bottom RTG MAP button
const rtgMapBottom = document.getElementById("rtgMapBottom");
if (rtgMapBottom) {
  rtgMapBottom.addEventListener("click", () => {
    window.location.href = "map.html";
  });
}

// ============================================================
// WEATHER MODULE
// ============================================================

const weatherTemp = document.getElementById("weatherTemp");
const weatherCondition = document.getElementById("weatherCondition");
const weatherLocation = document.getElementById("weatherLocation");
const weatherHighLow = document.getElementById("weatherHighLow");

function loadWeather() {
  if (!navigator.geolocation) {
    if (weatherLocation) weatherLocation.textContent = "Location unavailable";
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      const url = `https://api.weatherapi.com/v1/forecast.json?key=YOUR_KEY&q=${lat},${lon}&days=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (weatherTemp) weatherTemp.textContent = Math.round(data.current.temp_f) + "°";
      if (weatherCondition) weatherCondition.textContent = data.current.condition.text;
      if (weatherLocation) weatherLocation.textContent = data.location.name;

      const hi = Math.round(data.forecast.forecastday[0].day.maxtemp_f);
      const lo = Math.round(data.forecast.forecastday[0].day.mintemp_f);
      if (weatherHighLow) weatherHighLow.textContent = `H: ${hi}°  L: ${lo}°`;

    } catch (err) {
      if (weatherLocation) weatherLocation.textContent = "Weather unavailable";
    }
  });
}

loadWeather();
