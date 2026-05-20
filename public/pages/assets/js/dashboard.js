document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // SAFE MODE API WRAPPER — ALWAYS RETURNS JSON OR NULL
  // ============================================================
  const API = {
    headers() {
      return { "Content-Type": "application/json" };
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

  console.warn("SAFE MODE ENABLED — Dashboard will not redirect.");

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
  // NOTIFICATIONS (D1)
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
      div.className = `notif-item notif-${n.type}`;
      div.textContent = n.message;
      notifList.appendChild(div);
    });
  }

  loadNotifications();

  // ============================================================
  // WEATHER (LIVE + D1 PROFILE LOCATION)
  // ============================================================
  async function getUserLocation() {
    const profile = await API.get("/api/profile");

    if (profile && profile.lat && profile.lon) {
      return { lat: profile.lat, lon: profile.lon };
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 34.0, lon: -84.0 }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  async function fetchWeather(lat, lon) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true&hourly=windgusts_10m&temperature_unit=fahrenheit&timezone=auto`;

      const res = await fetch(url);
      return res.json();
    } catch (err) {
      console.error("Weather fetch failed:", err);
      return null;
    }
  }

  function applyWeatherBackground(code) {
    const bgLayer = document.getElementById("rtgBackground");
    if (!bgLayer) return;

    let bg = "radial-gradient(circle at top, #1f5f2b 0, #061b06 55%, #020a02 100%)";

    if (code === 0 || code === 1) bg = "radial-gradient(circle at top, #3fa34d 0, #061b06 55%, #020a02 100%)";
    else if (code === 2) bg = "radial-gradient(circle at top, #2f6f3d 0, #061b06 55%, #020a02 100%)";
    else if (code === 3) bg = "radial-gradient(circle at top, #1f3f2b 0, #020a02 55%, #000 100%)";
    else if (code >= 51 && code <= 67) bg = "radial-gradient(circle at top, #1f3f4f 0, #020a02 55%, #000 100%)";
    else if (code >= 71 && code <= 77) bg = "radial-gradient(circle at top, #cfdfeF 0, #061b06 55%, #020a02 100%)";
    else if (code >= 95) bg = "radial-gradient(circle at top, #4b1f1f 0, #020a02 55%, #000 100%)";

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

    tempEl.textContent = `${today.temperature}°F`;
    condEl.textContent = `Code ${today.weathercode}`;
    windEl.textContent = `Wind: ${today.windspeed} mph`;
    gustEl.textContent = `Gusts: ${today.windgusts ?? "--"} mph`;
    windReadout.textContent = `${today.windspeed} mph`;

    applyWeatherBackground(today.weathercode);

    const wind = today.windspeed || 0;
    const gust = today.windgusts || wind;
    const score = Math.min(100, Math.max(0, Math.round((wind * 2 + gust) / 3)));

    hazardScoreReadout.textContent = `Score: ${score}`;
    hazardBar.style.width = `${score}%`;

    const angle = Math.min(180, Math.max(0, (wind / 50) * 180));
    windNeedle.style.transform = `rotate(${angle - 90}deg)`;

    if (wind > 25) RTGnotify(`High winds detected (${wind} mph). Use caution.`, "warn");
    if (gust > 35) RTGnotify(`Strong gusts detected (${gust} mph). Hazard increased.`, "danger");
  }

  async function loadWeather() {
    const { lat, lon } = await getUserLocation();
    const data = await fetchWeather(lat, lon);

    if (!data || !data.current_weather) return;

    const today = {
      temperature: data.current_weather.temperature,
      weathercode: data.current_weather.weathercode,
      windspeed: data.current_weather.windspeed,
      windgusts: data.hourly?.windgusts_10m?.[0] ?? data.current_weather.windspeed
    };

    updateWeatherUI(today);
  }

  loadWeather();
  setInterval(loadWeather, 5 * 60 * 1000);

  // ============================================================
  // TODAY'S JOB (D1)
  // ============================================================
  async function loadDashboardJob() {
    const body = document.getElementById("dashJobBody");

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
