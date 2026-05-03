// ============================================================
// REAL TREE GUY — DASHBOARD JS (FINAL BUILD)
// Clock • Sidebar • Weather • Compass
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // CLOCK
  // ============================================================
  const clockEl = document.getElementById("rtgClock");

  function updateClock() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
  }

  updateClock();
  setInterval(updateClock, 1000);


  // ============================================================
  // SIDEBAR TOGGLE (LOGO + BURGER)
  // ============================================================
  const burger = document.getElementById("rtgBurger");
  const sidemenu = document.getElementById("rtgSidemenu");
  const logo = document.querySelector(".rtg-logo");

  function toggleMenu() {
    sidemenu.classList.toggle("open");
  }

  if (burger) burger.addEventListener("click", toggleMenu);
  if (logo) logo.addEventListener("click", toggleMenu);


  // ============================================================
  // WEATHER (FREE API + REAL LOCATION)
  // ============================================================
  async function getLocation() {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 34.0, lon: -84.0 }) // fallback ATL
      );
    });
  }

  async function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    return res.json();
  }

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

  async function loadWeather() {
    const { lat, lon } = await getLocation();
    const data = await getWeather(lat, lon);

    if (data && data.current_weather) {
      applyWeatherBackground(data.current_weather.weathercode);
    }
  }

  loadWeather();


  // ============================================================
  // COMPASS (REAL DEVICE ORIENTATION)
  // ============================================================
  const compassEl = document.getElementById("rtgCompass");

  if (compassEl) {
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", e => {
        if (e.webkitCompassHeading) {
          // iOS
          compassEl.style.transform = `rotate(${e.webkitCompassHeading * -1}deg)`;
        } else if (e.alpha !== null) {
          // Android
          compassEl.style.transform = `rotate(${e.alpha * -1}deg)`;
        }
      });
    } else {
      // fallback: show static compass
      compassEl.style.opacity = "0.5";
    }
  }

});
