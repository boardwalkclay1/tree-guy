// ============================================================
// REAL TREE GUY — ONLINE RADIO JS (ADVANCED)
// Tree Guy Hub • Squads • Channels • Presence • PTT
// Connects to same Worker: /api/radio/*
// ============================================================

(function () {
  // ============================================================
  // DOM
  // ============================================================
  const el = {
    status: document.getElementById("radio-status"),
    channelSelect: document.getElementById("radio-channel"),
    connectBtn: document.getElementById("radio-connect"),
    disconnectBtn: document.getElementById("radio-disconnect"),
    pttBtn: document.getElementById("radio-ptt"),
    channelDisplay: document.getElementById("radio-channel-display"),
    log: document.getElementById("radio-log"),
    peers: document.getElementById("radio-peers"),
    squadsList: document.getElementById("radio-squads"),
    friendsList: document.getElementById("radio-friends")
  };

  // ============================================================
  // ID / NAME CONTEXT
  // ============================================================
  const operatorName =
    (document.body && document.body.dataset.radioName) ||
    "Operator";

  const operatorId =
    (document.body && document.body.dataset.radioId) ||
    `tg-${Math.random().toString(36).slice(2, 10)}`;

  // ============================================================
  // API BASE (same Worker as contracts center)
// ============================================================
  const API_BASE = "https://api.realtreeguy.com/api";

  // ============================================================
  // SAFE JSON
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
      console.error("❌ JSON parse failed at:", url, err);
      return null;
    }
  }

  const API = {
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
    },

    async get(path) {
      const url = `${API_BASE}${path}`;
      try {
        const res = await fetch(url, {
          headers: { "Accept": "application/json" }
        });
        return await safeJson(res, url);
      } catch (err) {
        console.error("❌ GET failed:", url, err);
        return null;
      }
    }
  };

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    connected: false,
    channel: el.channelSelect ? el.channelSelect.value : "1",
    talking: false,
    peers: new Map(),      // id → { name, channel, lastSeen, squad }
    squads: new Map(),     // squadName → { members: [] }
    friends: new Map(),    // friendId → { name, status }
    selfId: operatorId,
    ws: null,
    lastPresenceTs: 0,
    heartbeatTimer: null,
    reconnectTimer: null
  };

  // ============================================================
  // LOG
  // ============================================================
  function appendLog(message, type = "info") {
    if (!el.log) return;
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const line = document.createElement("div");
    line.className = `radio-log-line radio-log-line--${type}`;
    line.textContent = `[${ts}] ${message}`;
    el.log.appendChild(line);
    el.log.scrollTop = el.log.scrollHeight;
  }

  // ============================================================
  // PEERS / SQUADS / FRIENDS RENDER
  // ============================================================
  function renderPeers() {
    if (!el.peers) return;
    el.peers.innerHTML = "";

    const entries = Array.from(state.peers.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!entries.length) {
      const li = document.createElement("div");
      li.className = "radio-peer-empty";
      li.textContent = "No other operators connected.";
      el.peers.appendChild(li);
      return;
    }

    for (const peer of entries) {
      const li = document.createElement("div");
      li.className = "radio-peer";

      const name = document.createElement("span");
      name.className = "radio-peer-name";
      name.textContent = peer.name;

      const chan = document.createElement("span");
      chan.className = "radio-peer-channel";
      chan.textContent = `CH ${peer.channel}`;

      const squad = document.createElement("span");
      squad.className = "radio-peer-squad";
      squad.textContent = peer.squad ? `Squad: ${peer.squad}` : "";

      li.appendChild(name);
      li.appendChild(chan);
      li.appendChild(squad);
      el.peers.appendChild(li);
    }
  }

  function renderSquads() {
    if (!el.squadsList) return;
    el.squadsList.innerHTML = "";

    const entries = Array.from(state.squads.entries());
    if (!entries.length) {
      el.squadsList.textContent = "No squads configured.";
      return;
    }

    for (const [name, squad] of entries) {
      const li = document.createElement("div");
      li.className = "radio-squad";

      const title = document.createElement("span");
      title.className = "radio-squad-name";
      title.textContent = name;

      const members = document.createElement("span");
      members.className = "radio-squad-members";
      members.textContent = `Members: ${squad.members.length}`;

      li.appendChild(title);
      li.appendChild(members);
      el.squadsList.appendChild(li);
    }
  }

  function renderFriends() {
    if (!el.friendsList) return;
    el.friendsList.innerHTML = "";

    const entries = Array.from(state.friends.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!entries.length) {
      el.friendsList.textContent = "No lumberjack friends yet.";
      return;
    }

    for (const friend of entries) {
      const li = document.createElement("div");
      li.className = "radio-friend";

      const name = document.createElement("span");
      name.className = "radio-friend-name";
      name.textContent = friend.name;

      const status = document.createElement("span");
      status.className = "radio-friend-status";
      status.textContent = friend.status || "offline";

      const actions = document.createElement("div");
      actions.className = "radio-friend-actions";

      const msgBtn = document.createElement("button");
      msgBtn.textContent = "Message";
      msgBtn.addEventListener("click", () => {
        appendLog(`Message to ${friend.name} (TODO: hook to messaging)`, "info");
      });

      const squadBtn = document.createElement("button");
      squadBtn.textContent = "Add to Squad";
      squadBtn.addEventListener("click", () => {
        appendLog(`Add ${friend.name} to squad (TODO: hook to squads)`, "info");
      });

      const chanBtn = document.createElement("button");
      chanBtn.textContent = "Add to Channel";
      chanBtn.addEventListener("click", () => {
        appendLog(`Add ${friend.name} to radio channel (TODO: hook to radio groups)`, "info");
      });

      actions.appendChild(msgBtn);
      actions.appendChild(squadBtn);
      actions.appendChild(chanBtn);

      li.appendChild(name);
      li.appendChild(status);
      li.appendChild(actions);
      el.friendsList.appendChild(li);
    }
  }

  // ============================================================
  // STATUS
  // ============================================================
  function setStatus(connected) {
    state.connected = connected;

    if (el.status) {
      el.status.textContent = connected ? "Connected" : "Disconnected";
      el.status.classList.toggle("radio-status--connected", connected);
      el.status.classList.toggle("radio-status--disconnected", !connected);
    }

    if (el.connectBtn) el.connectBtn.disabled = connected;
    if (el.disconnectBtn) el.disconnectBtn.disabled = !connected;
    if (el.pttBtn) el.pttBtn.disabled = !connected;

    if (connected) {
      appendLog(`Radio connected on channel ${state.channel}`, "ok");
    } else {
      appendLog("Radio disconnected", "warn");
      state.peers.clear();
      renderPeers();
      stopHeartbeat();
    }
  }

  // ============================================================
  // CHANNEL
  // ============================================================
  function setChannel(channel) {
    state.channel = channel;
    if (el.channelDisplay) {
      el.channelDisplay.textContent = `Channel: ${channel}`;
    }
    appendLog(`Switched to channel ${channel}`, "info");

    if (state.connected && state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: "channel-change",
        id: state.selfId,
        name: operatorName,
        channel
      }));
    }
  }

  // ============================================================
  // TALKING
  // ============================================================
  function startTalking() {
    if (!state.connected || state.talking) return;
    state.talking = true;

    if (el.pttBtn) {
      el.pttBtn.classList.add("radio-ptt-btn--active");
      el.pttBtn.textContent = "Talking…";
    }

    appendLog(`Transmitting on channel ${state.channel}`, "tx");

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: "tx-start",
        id: state.selfId,
        name: operatorName,
        channel: state.channel
      }));
    }
  }

  function stopTalking() {
    if (!state.talking) return;
    state.talking = false;

    if (el.pttBtn) {
      el.pttBtn.classList.remove("radio-ptt-btn--active");
      el.pttBtn.textContent = "Hold to Talk";
    }

    appendLog("Stopped transmitting", "tx");

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: "tx-stop",
        id: state.selfId,
        name: operatorName,
        channel: state.channel
      }));
    }
  }

  // ============================================================
  // PRESENCE (Worker /api/radio/presence)
// ============================================================
  async function sendPresence() {
    const now = Date.now();
    if (now - state.lastPresenceTs < 15000) return; // 15s throttle
    state.lastPresenceTs = now;

    await API.post("/radio/presence", {
      user_id: state.selfId,
      email: null,
      type: "tree-guy",
      ts: now
    });
  }

  function startHeartbeat() {
    stopHeartbeat();
    state.heartbeatTimer = setInterval(() => {
      if (state.connected) {
        sendPresence();
        if (state.ws && state.ws.readyState === WebSocket.OPEN) {
          state.ws.send(JSON.stringify({
            type: "heartbeat",
            id: state.selfId,
            name: operatorName,
            channel: state.channel
          }));
        }
      }
    }, 15000);
  }

  function stopHeartbeat() {
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }
  }

  // ============================================================
  // CONNECT
  // ============================================================
  async function connect() {
    if (state.connected) return;

    try {
      const data = await API.post("/radio/connect", {
        id: state.selfId,
        name: operatorName,
        channel: state.channel
      });

      if (!data || !data.wsUrl) {
        appendLog("Failed to get radio signaling URL", "warn");
        return;
      }

      const wsUrl = data.wsUrl
        .replace(/^https:/, "wss:")
        .replace(/^http:/, "ws:");

      const ws = new WebSocket(wsUrl);
      state.ws = ws;

      ws.onopen = () => {
        setStatus(true);
        startHeartbeat();
        ws.send(JSON.stringify({
          type: "join",
          id: state.selfId,
          name: operatorName,
          channel: state.channel
        }));
        sendPresence();
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!msg || msg.id === state.selfId) return;

        switch (msg.type) {
          case "join":
            state.peers.set(msg.id, {
              name: msg.name,
              channel: msg.channel,
              lastSeen: Date.now(),
              squad: msg.squad || null
            });
            appendLog(`${msg.name} connected on CH ${msg.channel}`, "peer");
            break;

          case "leave":
            state.peers.delete(msg.id);
            appendLog(`${msg.name} disconnected`, "peer");
            break;

          case "channel-change":
            state.peers.set(msg.id, {
              name: msg.name,
              channel: msg.channel,
              lastSeen: Date.now(),
              squad: msg.squad || null
            });
            appendLog(`${msg.name} moved to CH ${msg.channel}`, "peer");
            break;

          case "tx-start":
            appendLog(`${msg.name} talking on CH ${msg.channel}`, "peer-tx");
            break;

          case "tx-stop":
            appendLog(`${msg.name} stopped talking`, "peer-tx");
            break;

          case "heartbeat":
            const existing = state.peers.get(msg.id);
            if (existing) {
              existing.lastSeen = Date.now();
            }
            break;

          case "squad-update":
            if (msg.squad && msg.members) {
              state.squads.set(msg.squad, { members: msg.members });
              renderSquads();
            }
            break;

          case "friend-update":
            if (msg.friend_id && msg.name) {
              state.friends.set(msg.friend_id, {
                name: msg.name,
                status: msg.status || "online"
              });
              renderFriends();
            }
            break;
        }

        renderPeers();
      };

      ws.onclose = () => {
        stopTalking();
        setStatus(false);
        state.ws = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        appendLog("Radio signaling error", "warn");
      };
    } catch (err) {
      appendLog("Radio connect failed", "warn");
    }
  }

  // ============================================================
  // RECONNECT
  // ============================================================
  function scheduleReconnect() {
    if (state.reconnectTimer) return;
    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      if (!state.connected) {
        appendLog("Attempting radio reconnect…", "info");
        connect();
      }
    }, 5000);
  }

  // ============================================================
  // DISCONNECT
  // ============================================================
  function disconnect() {
    stopTalking();
    stopHeartbeat();

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: "leave",
        id: state.selfId,
        name: operatorName,
        channel: state.channel
      }));
      state.ws.close();
    }

    state.ws = null;
    setStatus(false);
  }

  // ============================================================
  // EVENTS
  // ============================================================
  function bindEvents() {
    if (el.channelSelect) {
      el.channelSelect.addEventListener("change", (e) => {
        setChannel(e.target.value);
      });
    }

    if (el.connectBtn) {
      el.connectBtn.addEventListener("click", connect);
    }

    if (el.disconnectBtn) {
      el.disconnectBtn.addEventListener("click", disconnect);
    }

    if (el.pttBtn) {
      el.pttBtn.addEventListener("mousedown", startTalking);
      el.pttBtn.addEventListener("mouseup", stopTalking);
      el.pttBtn.addEventListener("mouseleave", stopTalking);

      el.pttBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        startTalking();
      });
      el.pttBtn.addEventListener("touchend", (e) => {
        e.preventDefault();
        stopTalking();
      });
      el.pttBtn.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        stopTalking();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        if (!state.talking) startTalking();
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        stopTalking();
      }
    });
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.RTGOnlineRadio = {
    connect,
    disconnect,
    setChannel,
    startTalking,
    stopTalking,
    getState() {
      return {
        ...state,
        peers: Array.from(state.peers.values()),
        squads: Array.from(state.squads.entries()),
        friends: Array.from(state.friends.values())
      };
    }
  };

  // ============================================================
  // INIT
  // ============================================================
  if (el.channelSelect) {
    setChannel(el.channelSelect.value);
  }
  setStatus(false);
  bindEvents();
  renderPeers();
  renderSquads();
  renderFriends();
  appendLog(`Online radio ready as ${operatorName} (${state.selfId})`, "info");
})();
