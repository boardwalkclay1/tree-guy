// ============================================================
// REAL TREE GUY OS — DASHBOARD CORE (Worker APIs Only)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // AUTH CONTEXT → SENT TO WORKER AS HEADERS
  // ============================================================
  const rtgUserId = localStorage.getItem("rtgUserId") || "dev";
  const rtgUserEmail = localStorage.getItem("rtgUserEmail") || "dev@local";
  const rtgUserType = localStorage.getItem("rtgUserType") || "tree";
  const rtgUserName = localStorage.getItem("rtgUserName") || "Tree Guy";

  // ============================================================
  // FIXED: API BASE → YOUR WORKER DOMAIN
  // ============================================================
  const API_BASE = "https://api.realtreeguy.com/api";

  // ============================================================
  // SAFE MODE API WRAPPER — ALWAYS RETURNS JSON OR NULL
  // ============================================================
  const API = {
    headers() {
      return {
        "Content-Type": "application/json",
        "X-RTG-User": rtgUserId,
        "X-RTG-Email": rtgUserEmail,
        "X-RTG-Type": rtgUserType,
        "X-RTG-Name": rtgUserName
      };
    },

    async post(path, body) {
      try {
        const res = await fetch(`${API_BASE}${path}`, {
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
    },

    async get(path) {
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          headers: this.headers()
        });

        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          console.warn("GET returned non‑JSON at", path, text.slice(0, 120));
          return null;
        }
      } catch (err) {
        console.error("GET failed:", path, err);
        return null;
      }
    }
  };

  console.warn("SAFE MODE ENABLED — Dashboard using Worker APIs ONLY.");

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

      const today = {
        temperature: data.current_weather.temperature,
        code: data.current_weather.weathercode,
        wind: data.current_weather.windspeed,
        gust: data.current_weather.windspeed
      };

      updateWeatherUI(today);
    } catch (err) {
      console.error("Weather fetch failed:", err);
    }
  }

  function updateWeatherUI(today) {
    const tempEl = document.getElementById("dashWxTemp");
    const condEl = document.getElementById("dashWxCond");
    const windEl = document.getElementById("dashWxWind");
    const gustEl = document.getElementById("dashWxGust");

    tempEl.textContent = `${today.temperature}°F`;
    condEl.textContent = `Code ${today.code}`;
    windEl.textContent = `Wind: ${today.wind} mph`;
    gustEl.textContent = `Gusts: ${today.gust} mph`;
  }

  loadWeather();
  setInterval(loadWeather, 5 * 60 * 1000);

  // ============================================================
  // RADIO HEARTBEAT (FINAL VERSION WITH USERNAME CONFIRMATION)
  // ============================================================
  async function radioHeartbeat() {
    const pos = await getUserLocation();

    const res = await API.post("/radio/heartbeat", {
      user_id: rtgUserId,
      email: rtgUserEmail,
      type: rtgUserType,
      name: rtgUserName,     // ⭐ Username included
      lat: pos.lat,
      lon: pos.lon,
      ts: Date.now()
    });

    // Show confirmation in console
    if (res && res.ok) {
      console.log(`🔊 Heartbeat OK — ${rtgUserName} (${rtgUserId})`);
    } else {
      console.warn("⚠ Heartbeat failed:", res);
    }
  }

  radioHeartbeat();
  setInterval(radioHeartbeat, 15000);

});
