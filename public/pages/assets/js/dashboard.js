// ============================================================
// REAL TREE GUY — DASHBOARD JS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // CLOCK
  const clockEl = document.getElementById("rtgClock");
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  updateClock();
  setInterval(updateClock, 1000);

  // SIDEBAR TOGGLE
  const burger = document.getElementById("rtgBurger");
  const sidemenu = document.getElementById("rtgSidemenu");
  const logo = document.getElementById("rtgLogo");

  function toggleMenu() {
    if (!sidemenu) return;
    sidemenu.classList.toggle("open");
  }
  burger?.addEventListener("click", toggleMenu);
  logo?.addEventListener("click", toggleMenu);

  // STORAGE UTILS
  const Storage = {
    get(key, fallback = []) {
      try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // WEATHER BACKGROUND (OPTIONAL)
  function applyWeatherBackground(code) {
    const bgLayer = document.getElementById("rtgBackground");
    if (!bgLayer) return;

    let bg = "none";
    if (code === 0 || code === 1) bg = "radial-gradient(circle at top, #3fa34d 0, #061b06 55%, #020a02 100%)";
    else if (code === 2) bg = "radial-gradient(circle at top, #2f6f3d 0, #061b06 55%, #020a02 100%)";
    else if (code === 3) bg = "radial-gradient(circle at top, #1f3f2b 0, #020a02 55%, #000 100%)";
    else if (code >= 51 && code <= 67) bg = "radial-gradient(circle at top, #1f3f4f 0, #020a02 55%, #000 100%)";
    else if (code >= 71 && code <= 77) bg = "radial-gradient(circle at top, #cfdfeF 0, #061b06 55%, #020a02 100%)";
    else if (code >= 95) bg = "radial-gradient(circle at top, #4b1f1f 0, #020a02 55%, #000 100%)";

    bgLayer.style.background = bg;
  }

  // DASHBOARD WEATHER CARD + GAUGES
  function loadDashboardWeatherAndHazard() {
    const today = JSON.parse(localStorage.getItem("rtgWeatherToday") || "null");
    if (!today) return;

    const tempEl = document.getElementById("dashWxTemp");
    const condEl = document.getElementById("dashWxCond");
    const windEl = document.getElementById("dashWxWind");
    const gustEl = document.getElementById("dashWxGust");
    const windReadout = document.getElementById("windSpeedReadout");
    const windNeedle = document.getElementById("windNeedle");
    const hazardBar = document.getElementById("hazardBar");
    const hazardScoreReadout = document.getElementById("hazardScoreReadout");

    if (tempEl) tempEl.textContent = `${today.temperature}°F`;
    if (condEl) condEl.textContent = `Code ${today.weathercode}`;
    if (windEl) windEl.textContent = `Wind: ${today.windspeed ?? "--"} mph`;
    if (gustEl) gustEl.textContent = `Gusts: ${today.windgusts ?? "--"} mph`;
    if (windReadout) windReadout.textContent = `${today.windspeed ?? "--"} mph`;

    applyWeatherBackground(today.weathercode);

    const wind = today.windspeed || 0;
    const gust = today.windgusts || wind;
    const score = Math.min(100, Math.round((wind * 2 + gust) / 3));

    if (hazardScoreReadout) hazardScoreReadout.textContent = `Score: ${score}`;
    if (hazardBar) hazardBar.style.width = `${score}%`;

    const angle = Math.min(180, (wind / 50) * 180);
    if (windNeedle) windNeedle.style.transform = `rotate(${angle - 90}deg)`;
  }

  loadDashboardWeatherAndHazard();

  // TODAY'S JOB CARD
  function loadDashboardJob() {
    const jobs = Storage.get("rtgJobs");
    const todayStr = new Date().toDateString();
    const todaysJobs = jobs.filter(j => {
      if (!j.date) return false;
      return new Date(j.date).toDateString() === todayStr;
    });

    const body = document.getElementById("dashJobBody");
    if (!body) return;

    if (todaysJobs.length === 0) {
      body.innerHTML = `<p>No jobs scheduled today.</p>`;
      return;
    }

    const job = todaysJobs[0];
    body.innerHTML = `
      <h3>${job.client || "Unnamed Job"}</h3>
      <p><strong>Time:</strong> ${job.time || "N/A"}</p>
      <p><strong>Address:</strong> ${job.address || "N/A"}</p>
      <p><strong>Notes:</strong> ${job.notes || "None"}</p>
    `;
  }

  loadDashboardJob();

});
