// ============================================================
// REAL TREE GUY — RADIO JS
// Jobsite Radio • Channel State • Peer Presence • PTT
// Cloudflare Worker-backed signaling + presence
// ============================================================

(function () {
  const el = {
    status: document.getElementById("radio-status"),
    channelSelect: document.getElementById("radio-channel"),
    connectBtn: document.getElementById("radio-connect"),
    disconnectBtn: document.getElementById("radio-disconnect"),
    pttBtn: document.getElementById("radio-ptt"),
    channelDisplay: document.getElementById("radio-channel-display"),
    log: document.getElementById("radio-log"),
    peers: document.getElementById("radio-peers")
  };

  const operatorName =
    (document.body && document.body.dataset.radioName) ||
    "Operator";

  const API_BASE = "https://api.realtreeguy.com/api/radio";

  const state = {
    connected: false,
    channel: el.channelSelect ? el.channelSelect.value : "1",
    talking: false,
    peers: new Map(),
    selfId: `${operatorName}-${Math.random().toString(36).slice(2, 8)}`,
    ws: null
  };

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

  function renderPeers() {
    if (!el.peers) return;
    el.peers.innerHTML = "";

    const entries = Array.from(state.peers.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    if (entries.length === 0) {
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

      li.appendChild(name);
      li.appendChild(chan);
      el.peers.appendChild(li);
    }
  }

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
    }
  }

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

  async function connect() {
    if (state.connected) return;

    try {
      const res = await fetch(`${API_BASE}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.selfId,
          name: operatorName,
          channel: state.channel
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        appendLog(data.error || "Failed to connect radio", "warn");
        return;
      }

      const wsUrl = data.wsUrl;
      if (!wsUrl) {
        appendLog("No signaling URL from radio worker", "warn");
        return;
      }

      const ws = new WebSocket(wsUrl.replace(/^http/, "ws"));
      state.ws = ws;

      ws.onopen = () => {
        setStatus(true);
        ws.send(JSON.stringify({
          type: "join",
          id: state.selfId,
          name: operatorName,
          channel: state.channel
        }));
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
              lastSeen: Date.now()
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
              lastSeen: Date.now()
            });
            appendLog(`${msg.name} moved to CH ${msg.channel}`, "peer");
            break;

          case "tx-start":
            appendLog(`${msg.name} talking on CH ${msg.channel}`, "peer-tx");
            break;

          case "tx-stop":
            appendLog(`${msg.name} stopped talking`, "peer-tx");
            break;
        }

        renderPeers();
      };

      ws.onclose = () => {
        stopTalking();
        setStatus(false);
        state.ws = null;
      };

      ws.onerror = () => {
        appendLog("Radio signaling error", "warn");
      };
    } catch (err) {
      appendLog("Radio connect failed", "warn");
    }
  }

  function disconnect() {
    stopTalking();

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

  window.RTGRadio = {
    connect,
    disconnect,
    setChannel,
    startTalking,
    stopTalking,
    getState() {
      return { ...state, peers: Array.from(state.peers.values()) };
    }
  };

  if (el.channelSelect) {
    setChannel(el.channelSelect.value);
  }
  setStatus(false);
  bindEvents();
  renderPeers();
  appendLog(`Radio widget ready as ${operatorName}`, "info");
})();
