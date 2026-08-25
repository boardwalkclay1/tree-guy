// ============================================================
// REAL TREE GUY OS — DASHBOARD CORE (STABLE VERSION)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // AUTH CONTEXT
  // ============================================================
  const rtgUserId = localStorage.getItem("rtgUserId") || "dev";
  const rtgUserEmail = localStorage.getItem("rtgUserEmail") || "dev@local";
  const rtgUserType = localStorage.getItem("rtgUserType") || "tree";
  const rtgUserName = localStorage.getItem("rtgUserName") || "Tree Guy";

  const nameEl = document.getElementById("rtgUserName");
  if (nameEl) nameEl.textContent = rtgUserName;

  // ============================================================
  // FIXED API BASE
  // ============================================================
  const API_BASE = "https://api.realtreeguy.com/api";

  // ============================================================
  // SAFE JSON WRAPPER
  // ============================================================
  async function safeJson(res, url) {
    const text = await res.text();
    if (!text || text.trim().startsWith("<")) {
      console.warn("❌ API returned HTML instead of JSON:", url);
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn("❌ JSON parse failed:", url, err);
      return null;
    }
  }

  // ============================================================
  // API WRAPPER
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

    async post(path, body) {
      const url = `${API_BASE}${path}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body)
        });
        return await safeJson(res, url);
      } catch (err) {
        console.error("❌ POST failed:", url, err);
        return null;
      }
    },

    async get(path) {
      const url = `${API_BASE}${path}`;
      try {
        const res = await fetch(url, { headers: this.headers() });
        return await safeJson(res, url);
      } catch (err) {
        console.error("❌ GET failed:", url, err);
        return null;
      }
    }
  };

  console.warn("SAFE MODE ENABLED — Dashboard using Worker APIs ONLY.");

  // ============================================================
  // CLOCK (NO FLICKER)
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
  // WEATHER (GPS ONLY)
  // ============================================================
  async function getUserLocation() {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve({ lat: 34.0, lon: -84.0 }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  async function loadWeather() {
    const { lat, lon } = await getUserLocation();

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true&temperature_unit=fahrenheit&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      const cw = data.current_weather || {};

      updateWeatherUI({
        temperature: cw.temperature ?? "--",
        code: cw.weathercode ?? "--",
        wind: cw.windspeed ?? "--",
        gust: cw.windspeed ?? "--"
      });

      updateWindHazard(cw.windspeed);
      updateTreeHazard(cw.weathercode);

    } catch (err) {
      console.error("Weather fetch failed:", err);
    }
  }

  function updateWeatherUI(today) {
    const tempEl = document.getElementById("dashWxTemp");
    const condEl = document.getElementById("dashWxCond");
    const windEl = document.getElementById("dashWxWind");
    const gustEl = document.getElementById("dashWxGust");

    if (tempEl) tempEl.textContent = `${today.temperature}°F`;
    if (condEl) condEl.textContent = `Code ${today.code}`;
    if (windEl) windEl.textContent = `Wind: ${today.wind} mph`;
    if (gustEl) gustEl.textContent = `Gusts: ${today.gust} mph`;
  }

  loadWeather();
  setInterval(loadWeather, 5 * 60 * 1000);

  // ============================================================
  // WIND HAZARD GAUGE
  // ============================================================
  function updateWindHazard(windSpeed) {
    const needle = document.getElementById("windNeedle");
    const readout = document.getElementById("windSpeedReadout");

    if (!needle || !readout) return;

    const speed = Number(windSpeed) || 0;

    // Convert wind speed to angle (0–180 degrees)
    const angle = Math.min(speed * 3, 180);

    needle.style.transform = `rotate(${angle}deg)`;
    readout.textContent = `${speed} mph`;
  }

  // ============================================================
  // TREE HAZARD GAUGE
  // ============================================================
  function updateTreeHazard(weatherCode) {
    const bar = document.getElementById("hazardBar");
    const readout = document.getElementById("hazardScoreReadout");

    if (!bar || !readout) return;

    // Simple hazard score based on weather code
    let score = 10;

    if (weatherCode >= 50) score = 40;   // rain
    if (weatherCode >= 60) score = 60;   // heavy rain
    if (weatherCode >= 70) score = 80;   // snow
    if (weatherCode >= 90) score = 100;  // storms

    bar.style.width = `${score}%`;
    readout.textContent = `Score: ${score}`;
  }

  // ============================================================
  // RADIO HEARTBEAT
  // ============================================================
  async function radioHeartbeat() {
    const pos = await getUserLocation();

    const res = await API.post("/radio/heartbeat", {
      user_id: rtgUserId,
      email: rtgUserEmail,
      type: rtgUserType,
      name: rtgUserName,
      lat: pos.lat,
      lon: pos.lon,
      ts: Date.now()
    });

    const statusEl = document.getElementById("radio-status");
    const pttBtn = document.getElementById("radio-ptt");
    const logEl = document.getElementById("radio-log");

    if (!statusEl || !pttBtn) return;

    if (res && res.ok) {
      statusEl.textContent = "Connected";
      statusEl.classList.remove("radio-status--disconnected");
      statusEl.classList.add("radio-status--connected");

      pttBtn.disabled = false;

      if (logEl) {
        logEl.innerHTML = `<div class="log-entry">Heartbeat OK @ ${new Date().toLocaleTimeString()}</div>`;
      }

    } else {
      statusEl.textContent = "Disconnected";
      statusEl.classList.remove("radio-status--connected");
      statusEl.classList.add("radio-status--disconnected");

      pttBtn.disabled = true;

      if (logEl) {
        logEl.innerHTML = `<div class="log-entry">Heartbeat FAIL @ ${new Date().toLocaleTimeString()}</div>`;
      }
    }
  }

  radioHeartbeat();
  setInterval(radioHeartbeat, 15000);

});
