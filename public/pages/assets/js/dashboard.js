// ============================================================
// REAL TREE GUY — DASHBOARD JS (BURGER MENU FIXED)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // CLOCK
  // ============================================================
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


  // ============================================================
  // SIDEBAR TOGGLE (FULLY OFF-SCREEN UNTIL CLICKED)
  // ============================================================
  const burger = document.getElementById("rtgBurger");
  const sidemenu = document.getElementById("rtgSidemenu");
  const logo = document.getElementById("rtgLogo");

  function toggleMenu() {
    sidemenu.classList.toggle("open");
  }

  burger.addEventListener("click", toggleMenu);
  logo.addEventListener("click", toggleMenu);

  // OPTIONAL: Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!sidemenu.classList.contains("open")) return;

    const clickedInsideMenu = sidemenu.contains(e.target);
    const clickedBurger = burger.contains(e.target);
    const clickedLogo = logo.contains(e.target);

    if (!clickedInsideMenu && !clickedBurger && !clickedLogo) {
      sidemenu.classList.remove("open");
    }
  });


  // ============================================================
  // STORAGE UTILS
  // ============================================================
  const Storage = {
    get(key, fallback = null) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };


  // ============================================================
  // NOTIFICATION SYSTEM
  // ============================================================
  const notifList = document.getElementById("rtgNotifList");

  function RTGnotify(msg, type = "info") {
    if (!notifList) return;

    const empty = notifList.querySelector(".notif-empty");
    if (empty) empty.remove();

    const div = document.createElement("div");
    div.className = `notif-item notif-${type}`;
    div.textContent = msg;

    notifList.prepend(div);
  }

  window.RTGnotify = RTGnotify;


  // ============================================================
  // WEATHER + GAUGES (LOCALSTORAGE SYNC ONLY)
  // ============================================================
  function updateWeatherUI(today) {
    const tempEl = document.getElementById("dashWxTemp");
    const condEl = document.getElementById("dashWxCond");
    const windEl = document.getElementById("dashWxWind");
    const gustEl = document.getElementById("dashWxGust");
    const windReadout = document.getElementById("windSpeedReadout");
    const windNeedle = document.getElementById("windNeedle");
    const hazardBar = document.getElementById("hazardBar");
    const hazardScoreReadout = document.getElementById("hazardScoreReadout");

    tempEl.textContent = `${today.temperature}°F`;
    condEl.textContent = `Code ${today.weathercode}`;
    windEl.textContent = `Wind: ${today.windspeed} mph`;
    gustEl.textContent = `Gusts: ${today.windgusts ?? "--"} mph`;
    windReadout.textContent = `${today.windspeed} mph`;

    const wind = today.windspeed || 0;
    const gust = today.windgusts || wind;
    const score = Math.min(100, Math.max(0, Math.round((wind * 2 + gust) / 3)));

    hazardScoreReadout.textContent = `Score: ${score}`;
    hazardBar.style.width = `${score}%`;

    const angle = Math.min(180, Math.max(0, (wind / 50) * 180));
    windNeedle.style.transform = `rotate(${angle - 90}deg)`;
  }

  function loadWeatherFromStorage() {
    const today = Storage.get("rtgWeatherToday");
    if (today) updateWeatherUI(today);
  }

  loadWeatherFromStorage();


  // ============================================================
  // TODAY'S JOB CARD
  // ============================================================
  function loadDashboardJob() {
    const jobs = Storage.get("rtgJobs", []);
    const todayStr = new Date().toDateString();
    const todaysJobs = jobs.filter(j => j.date && new Date(j.date).toDateString() === todayStr);

    const body = document.getElementById("dashJobBody");

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

    RTGnotify(`📋 Job today: ${job.client}`, "info");
  }

  loadDashboardJob();

});
