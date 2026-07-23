// ============================================================
// REAL TREE GUY OS — RADIO CENTER (FINAL FIXED VERSION)
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api";

// ============================================================
// AUTH CONTEXT (MATCH DASHBOARD)
// ============================================================
const rtgUserId = localStorage.getItem("rtgUserId") || "dev";
const rtgUserEmail = localStorage.getItem("rtgUserEmail") || "dev@local";
const rtgUserType = localStorage.getItem("rtgUserType") || "tree";
const rtgUserName = localStorage.getItem("rtgUserName") || "Tree Guy";

// ============================================================
// SAFE JSON WRAPPER
// ============================================================
async function safeJson(res, url) {
  const text = await res.text();
  if (!text || text.trim().startsWith("<")) {
    console.error("❌ API returned HTML instead of JSON:", url);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ JSON parse failed:", url, err);
    return null;
  }
}

// ============================================================
// API WRAPPER (WITH AUTH HEADERS)
// ============================================================
const API = {
  headers() {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-RTG-User": rtgUserId,
      "X-RTG-Email": rtgUserEmail,
      "X-RTG-Type": rtgUserType
    };
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
  }
};

// ============================================================
// STATE
// ============================================================
let currentChannel = null;
let presence = [];
let nearby = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadChannels();
  wireEvents();
  setInterval(updatePresence, 3000);
});

// ============================================================
// EVENTS
// ============================================================
function wireEvents() {
  document.getElementById("joinChannelBtn")?.addEventListener("click", joinChannel);
  document.getElementById("leaveChannelBtn")?.addEventListener("click", leaveChannel);
  document.getElementById("createChannelBtn")?.addEventListener("click", createChannel);
}

// ============================================================
// LOAD CHANNELS
// ============================================================
async function loadChannels() {
  const data = await API.get("/radio/channels");
  if (!data) return;

  const list = document.getElementById("channelList");
  if (!list) {
    console.error("❌ Missing #channelList in HTML");
    return;
  }

  list.innerHTML = data.map(ch =>
    `<button class="channel-btn" data-id="${ch.id}">
       📡 ${ch.name} (${ch.members}/20)
     </button>`
  ).join("");

  list.querySelectorAll(".channel-btn").forEach(btn => {
    btn.onclick = () => {
      currentChannel = btn.dataset.id;
      updatePresence();
    };
  });
}

// ============================================================
// CREATE CHANNEL
// ============================================================
async function createChannel() {
  const name = prompt("Channel name:");
  if (!name) return;

  const saved = await API.post("/radio/channel", {
    name,
    created_by: rtgUserId
  });

  if (!saved) return alert("Failed to create channel.");

  loadChannels();
}

// ============================================================
// JOIN CHANNEL
// ============================================================
async function joinChannel() {
  if (!currentChannel) return alert("Select a channel first.");

  const pos = await getGPS();
  if (!pos) return alert("GPS unavailable.");

  const res = await API.post("/radio/join", {
    channel_id: currentChannel,
    user_id: rtgUserId,
    lat: pos.lat,
    lon: pos.lon
  });

  if (!res) return alert("Join failed.");
  if (res.error) return alert(res.error);

  alert(`Connected as ${rtgUserName}.`);
  updatePresence();
}

// ============================================================
// LEAVE CHANNEL
// ============================================================
async function leaveChannel() {
  if (!currentChannel) return;

  await API.post("/radio/leave", {
    channel_id: currentChannel,
    user_id: rtgUserId
  });

  alert("Disconnected.");
  currentChannel = null;
  presence = [];
  nearby = [];
  renderPresence();
  renderNearby();
}

// ============================================================
// GET GPS
// ============================================================
async function getGPS() {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ============================================================
// UPDATE PRESENCE
// ============================================================
async function updatePresence() {
  if (!currentChannel) return;

  const pos = await getGPS();
  if (!pos) return;

  const data = await API.get(
    `/radio/presence?channel_id=${currentChannel}&lat=${pos.lat}&lon=${pos.lon}`
  );

  if (!data) return;

  presence = data.members || [];
  nearby = data.in_range_candidates || [];

  renderPresence();
  renderNearby();
}

// ============================================================
// RENDER CURRENT MEMBERS
// ============================================================
function renderPresence() {
  const box = document.getElementById("currentMembers");
  if (!box) return;

  if (!presence.length) {
    box.innerHTML = "<p>No active members.</p>";
    return;
  }

  box.innerHTML = presence.map(m =>
    `<div class="member">
       <strong>${m.name}</strong>
       <span>${m.distance_ft} ft</span>
       <span>${m.online ? "🟢" : "⚪"}</span>
     </div>`
  ).join("");
}

// ============================================================
// RENDER NEARBY USERS
// ============================================================
function renderNearby() {
  const box = document.getElementById("nearbyUsers");
  if (!box) return;

  if (!nearby.length) {
    box.innerHTML = "<p>No nearby users.</p>";
    return;
  }

  box.innerHTML = nearby.map(u =>
    `<div class="nearby">
       <strong>${u.name}</strong>
       <span>${u.distance_ft} ft</span>
       <button class="add-btn" data-id="${u.user_id}">Add</button>
     </div>`
  ).join("");

  box.querySelectorAll(".add-btn").forEach(btn => {
    btn.onclick = async () => {
      const pos = await getGPS();
      const res = await API.post("/radio/join", {
        channel_id: currentChannel,
        user_id: btn.dataset.id,
        lat: pos.lat,
        lon: pos.lon
      });

      if (!res || res.error) return alert(res?.error || "Join failed.");
      updatePresence();
    };
  });
}
