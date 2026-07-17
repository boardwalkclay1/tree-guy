// ============================================================
// REAL TREE GUY OS — DASHBOARD CORE (D1 + Worker APIs)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // AUTH CONTEXT → SENT TO WORKER AS HEADERS
  // ============================================================
  const rtgUserId = localStorage.getItem("rtgUserId") || "dev";
  const rtgUserEmail = localStorage.getItem("rtgUserEmail") || "dev@local";
  const rtgUserType = localStorage.getItem("rtgUserType") || "tree";

  // ============================================================
  // SAFE MODE API WRAPPER — ALWAYS RETURNS JSON OR NULL
  // ============================================================
  const API = {
    headers() {
      return {
        "Content-Type": "application/json",
        "X-RTG-User": rtgUserId,
        "X-RTG-Email": rtgUserEmail,
        "X-RTG-Type": rtgUserType
      };
    },

    async get(path) {
      try {
        const res = await fetch(path, { headers: this.headers() });
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          console.warn("API returned non‑JSON at", path, text.slice(0, 120));
          return null;
        }
      } catch (err) {
        console.error("GET failed:", path, err);
        return null;
      }
    },

    async post(path, body) {
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body)
        });
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          console.warn("POST returned non‑JSON at", path, text.slice(0, 120));
          return null;
        }
      } catch (err) {
        console.error("POST failed:", path, err);
        return null;
      }
    }
  };

  console.warn("SAFE MODE ENABLED — Dashboard using D1 + Worker APIs.");

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
  // NOTIFICATIONS (D1 via /api/notifications)
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

  async function loadNotifications() {
    const data = await API.get("/api/notifications");

    notifList.innerHTML = "";

    if (!data || !Array.isArray(data) || data.length === 0) {
      notifList.innerHTML = `<p class="notif-empty">No notifications.</p>`;
      return;
    }

    data.forEach(n => {
      const div = document.createElement("div");
      div.className = `notif-item notif-${n.type || "info"}`;
      div.textContent = n.message;
      notifList.appendChild(div);
    });
  }

  loadNotifications();

  // ============================================================
  // WEATHER (D1 + Worker: /api/weather + /api/weather/profile)
  // ============================================================
  async function getUserLocation() {
    // Use weather profile (D1) first
    const profile = await API.get("/api/weather/profile");

    if (profile && profile.lat && profile.lon) {
      return { lat: profile.lat, lon: profile.lon };
    }

    // Fallback to browser GPS
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 34.0, lon: -84.0 }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  function applyWeatherBackground(code) {
    const bgLayer = document.getElementById("rtgBackground");
    if (!bgLayer) return;

    let bg = "radial-gradient(circle at top, #1f5f2b 0, #061b06 55%, #020a02 100%)";

    if (code === 0 || code === 1)
      bg = "radial-gradient(circle at top, #3fa34d 0, #061b06 55%, #020a02 100%)";
    else if (code === 2)
      bg = "radial-gradient(circle at top, #2f6f3d 0, #061b06 55%, #020a02 100%)";
    else if (code === 3)
      bg = "radial-gradient(circle at top, #1f3f2b 0, #020a02 55%, #000 100%)";
    else if (code >= 51 && code <= 67)
      bg = "radial-gradient(circle at top, #1f3f4f 0, #020a02 55%, #000 100%)";
    else if (code >= 71 && code <= 77)
      bg = "radial-gradient(circle at top, #cfdfeF 0, #061b06 55%, #020a02 100%)";
    else if (code >= 95)
      bg = "radial-gradient(circle at top, #4b1f1f 0, #020a02 55%, #000 100%)";

    bgLayer.style.background = bg;
  }

  function updateWeatherUI(today) {
    const tempEl = document.getElementById("dashWxTemp");
    const condEl = document.getElementById("dashWxCond");
    const windEl = document.getElementById("dashWxWind");
    const gustEl = document.getElementById("dashWxGust");
    const windReadout = document.getElementById("windSpeedReadout");
    const windNeedle = document.getElementById("windNeedle");
    const hazardBar = document.getElementById("hazardBar");
    const hazardScoreReadout = document.getElementById("hazardScoreReadout");

    if (!tempEl || !condEl || !windEl || !gustEl) return;

    tempEl.textContent = `${today.temperature}°F`;
    condEl.textContent = `Code ${today.code}`;
    windEl.textContent = `Wind: ${today.wind} mph`;
    gustEl.textContent = `Gusts: ${today.gust ?? "--"} mph`;
    if (windReadout) windReadout.textContent = `${today.wind} mph`;

    applyWeatherBackground(today.code);

    const wind = today.wind || 0;
    const gust = today.gust || wind;
    const score = Math.min(100, Math.max(0, Math.round((wind * 2 + gust) / 3)));

    if (hazardScoreReadout) hazardScoreReadout.textContent = `Score: ${score}`;
    if (hazardBar) hazardBar.style.width = `${score}%`;

    if (windNeedle) {
      const angle = Math.min(180, Math.max(0, (wind / 50) * 180));
      windNeedle.style.transform = `rotate(${angle - 90}deg)`;
    }

    if (wind > 25) RTGnotify(`High winds detected (${wind} mph). Use caution.`, "warn");
    if (gust > 35) RTGnotify(`Strong gusts detected (${gust} mph). Hazard increased.`, "danger");
  }

  async function loadWeather() {
    const { lat, lon } = await getUserLocation();
    const data = await API.get(`/api/weather?lat=${lat}&lon=${lon}`);

    if (!data || !data.current) return;

    const today = {
      temperature: data.current.temperature,
      code: data.current.code,
      wind: data.current.wind,
      gust: data.current.gust
    };

    updateWeatherUI(today);
  }

  loadWeather();
  setInterval(loadWeather, 5 * 60 * 1000);

  // ============================================================
  // RADIO PRESENCE (D1 via /api/radio/presence)
// ============================================================
  async function pingRadio() {
    await API.post("/api/radio/presence", {
      user_id: rtgUserId,
      email: rtgUserEmail,
      type: rtgUserType,
      ts: Date.now()
    });
  }

  pingRadio();
  setInterval(pingRadio, 30 * 1000);

  // ============================================================
  // TODAY'S JOB (D1 via /api/dashboard/today)
// ============================================================
  async function loadDashboardJob() {
    const body = document.getElementById("dashJobBody");
    if (!body) return;

    const job = await API.get("/api/dashboard/today");

    if (!job || !job.id) {
      body.innerHTML = `<p>No jobs scheduled today.</p>`;
      return;
    }

    body.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>Status:</strong> ${job.status}</p>
      <p><strong>Location:</strong> ${job.location_city}, ${job.location_state}</p>
      <p><strong>Description:</strong> ${job.description}</p>
    `;

    RTGnotify(`📋 Job today: ${job.title}`, "info");
  }

  loadDashboardJob();
});
