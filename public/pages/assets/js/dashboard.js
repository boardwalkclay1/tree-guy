// ===============================
// GET USER LOCATION
// ===============================
async function getLocation() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }),
      () => resolve({ lat: 34.0, lon: -84.0 }) // fallback ATL
    );
  });
}

// ===============================
// FETCH REAL WEATHER (Open-Meteo)
// ===============================
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  return res.json();
}

// ===============================
// SET BACKGROUND BASED ON WEATHER
// ===============================
function applyWeatherBackground(code) {
  let bg = "/assets/img/weather/default.jpg";

  if (code === 0 || code === 1) bg = "/assets/img/weather/sunny.jpg";
  else if (code === 2) bg = "/assets/img/weather/partly.jpg";
  else if (code === 3) bg = "/assets/img/weather/cloudy.jpg";
  else if (code >= 51 && code <= 67) bg = "/assets/img/weather/rain.jpg";
  else if (code >= 71 && code <= 77) bg = "/assets/img/weather/snow.jpg";
  else if (code >= 95) bg = "/assets/img/weather/storm.jpg";

  document.body.style.background = `url('${bg}') center/cover fixed`;
}

// ===============================
// CLOCK
// ===============================
function updateClock() {
  const now = new Date();
  document.getElementById("rtgClock").textContent =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

// ===============================
// SIDEBAR
// ===============================
const burger = document.getElementById("rtgBurger");
const sidemenu = document.getElementById("rtgSidemenu");

burger.addEventListener("click", () => {
  sidemenu.classList.toggle("open");
});

// ===============================
// MAIN WEATHER ENGINE
// ===============================
(async () => {
  const { lat, lon } = await getLocation();
  const data = await getWeather(lat, lon);

  if (data && data.current_weather) {
    applyWeatherBackground(data.current_weather.weathercode);
  }
})();
