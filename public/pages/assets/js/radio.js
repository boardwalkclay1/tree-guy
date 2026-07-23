// ============================================================
// REAL TREE GUY OS — RADIO CENTER (FINAL VERSION)
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api";

// ============================================================
// SAFE JSON WRAPPER
// ============================================================
async function safeJson(res, url) {
  const text = await res.text();
  if (!text || text.trim().startsWith("<")) {
    console.error("❌ API returned HTML:", url);
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
// API WRAPPER
// ============================================================
const API = {
  async get(path) {
    const url = `${API_BASE}${path}`;
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
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
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
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
let userId = localStorage.getItem("rtgUserId");

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadChannels();
  wireEvents();
  setInterval(updatePresence, 3000); // live updates
});

// ============================================================
// EVENTS
// ============================================================
function wireEvents() {
  document.getElementById("joinChannelBtn")
    ?.addEventListener("click", joinChannel);

  document.getElementById("leaveChannelBtn")
    ?.addEventListener("click", leaveChannel);

  document.getElementById("createChannelBtn")
    ?.addEventListener("click", createChannel);
}

// ============================================================
// LOAD CHANNELS
// ============================================================
async function loadChannels() {
  const data = await API.get("/radio/channels");
  if (!data) return;

  const list = document.getElementById("channelList");
  list.innerHTML = data.map(ch =>
    `<button class="channel-btn" data-id="${ch.id}">
       📡 ${ch.name} (${ch.members.length}/20)
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
    created_by: userId
  });

  if (!saved) return alert("Failed to create channel.");

  loadChannels();
}

// ============================================================
// JOIN CHANNEL (requires proximity ≤ 1000 ft)
// ============================================================
async function joinChannel() {
  if (!currentChannel) return alert("Select a channel first.");

  const pos = await getGPS();
  if (!pos) return alert("GPS unavailable.");

  const res = await API.post("/radio/join", {
    channel_id: currentChannel,
    user_id: userId,
    lat: pos.lat,
    lon: pos.lon
  });

  if (!res) return alert("Join failed.");

  if (res.error) return alert(res.error);

  alert("Connected — infinite distance mode enabled.");
  updatePresence();
}

// ============================================================
// LEAVE CHANNEL
// ============================================================
async function leaveChannel() {
  if (!currentChannel) return;

  await API.post("/radio/leave", {
    channel_id: currentChannel,
    user_id: userId
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
// UPDATE PRESENCE (members + nearby candidates)
// ============================================================
async function updatePresence() {
  if (!currentChannel) return;

  const pos = await getGPS();
  const data = await API.get(`/radio/presence?channel_id=${currentChannel}&lat=${pos.lat}&lon=${pos.lon}`);

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
// RENDER NEARBY USERS (≤ 1000 ft)
// ============================================================
function renderNearby() {
  const box = document.getElementById("nearbyUsers");
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
