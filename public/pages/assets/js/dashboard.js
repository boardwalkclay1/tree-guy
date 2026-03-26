// REAL TREE GUY OS — DASHBOARD MODULE

// TREE BRANCH BUTTONS (if using .branch-btn links)
document.querySelectorAll(".branch-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    const href = btn.getAttribute("href");
    if (href) window.location.href = href;
  });
});

// BOTTOM BUTTONS UNDER TREE
const rtgShopBottom = document.getElementById("rtgShopBottom");
const rtgOnlineBottom = document.getElementById("rtgOnlineBottom");
const rtgMapBottom = document.getElementById("rtgMapBottom");

if (rtgShopBottom) {
  rtgShopBottom.addEventListener("click", e => {
    e.preventDefault();
    window.location.href = "/pages/real-tree-shop.html";
  });
}

if (rtgOnlineBottom) {
  rtgOnlineBottom.addEventListener("click", e => {
    e.preventDefault();
    window.location.href = "/pages/rtg-online.html";
  });
}

if (rtgMapBottom) {
  rtgMapBottom.addEventListener("click", e => {
    e.preventDefault();
    window.location.href = "/pages/map.html";
  });
}

// WEATHER MODULE
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
      if (!res.ok) throw new Error("Weather error");
      const data = await res.json();

      if (weatherTemp) weatherTemp.textContent = Math.round(data.current.temp_f) + "°";
      if (weatherCondition) weatherCondition.textContent = data.current.condition.text;
      if (weatherLocation) weatherLocation.textContent = data.location.name;

      const hi = Math.round(data.forecast.forecastday[0].day.maxtemp_f);
      const lo = Math.round(data.forecast.forecastday[0].day.mintemp_f);
      if (weatherHighLow) weatherHighLow.textContent = `H: ${hi}°  L: ${lo}°`;
    } catch {
      if (weatherLocation) weatherLocation.textContent = "Weather unavailable";
    }
  });
}

loadWeather();
