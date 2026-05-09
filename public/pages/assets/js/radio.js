// ============================================================
// REAL TREE GUY — RADIO JS
// Jobsite Radio • Channel State • Peer Presence • PTT
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

  // Operator identity (from data-attribute or fallback)
  const operatorName =
    (document.body && document.body.dataset.radioName) ||
    "Operator";

  const state = {
    connected: false,
    channel: el.channelSelect ? el.channelSelect.value : "1",
    talking: false,
    peers: new Map(), // id -> { name, channel, lastSeen }
    selfId: `${operatorName}-${Math.random().toString(36).slice(2, 8)}`
  };

  // BroadcastChannel for presence + events (multi-tab / multi-device)
  const radioBus = "BroadcastChannel" in window
    ? new BroadcastChannel("rtg-radio")
    : null;

  // ----------------------------------------------------------
  // LOGGING
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // PEER LIST RENDER
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // STATUS + CHANNEL
  // ----------------------------------------------------------
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
    }

    if (radioBus) {
      radioBus.postMessage({
        type: connected ? "join" : "leave",
        id: state.selfId,
        name: operatorName,
        channel: state.channel,
        ts: Date.now()
      });
    }
  }

  function setChannel(channel) {
    state.channel = channel;
    if (el.channelDisplay) {
      el.channelDisplay.textContent = `Channel: ${channel}`;
    }
    appendLog(`Switched to channel ${channel}`, "info");

    if (radioBus && state.connected) {
      radioBus.postMessage({
        type: "channel-change",
        id: state.selfId,
        name: operatorName,
        channel,
        ts: Date.now()
      });
    }
  }

  // ----------------------------------------------------------
  // TALK / PTT
  // ----------------------------------------------------------
  function startTalking() {
    if (!state.connected || state.talking) return;
    state.talking = true;

    if (el.pttBtn) {
      el.pttBtn.classList.add("radio-ptt-btn--active");
      el.pttBtn.textContent = "Talking…";
    }

    appendLog(`Transmitting on channel ${state.channel}`, "tx");

    if (radioBus) {
      radioBus.postMessage({
        type: "tx-start",
        id: state.selfId,
        name: operatorName,
        channel: state.channel,
        ts: Date.now()
      });
    }

    // 🔗 HOOK: start sending audio
    // radioTransport.startTx()
  }

  function stopTalking() {
    if (!state.talking) return;
    state.talking = false;

    if (el.pttBtn) {
      el.pttBtn.classList.remove("radio-ptt-btn--active");
      el.pttBtn.textContent = "Hold to Talk";
    }

    appendLog("Stopped transmitting", "tx");

    if (radioBus) {
      radioBus.postMessage({
        type: "tx-stop",
        id: state.selfId,
        name: operatorName,
        channel: state.channel,
        ts: Date.now()
      });
    }

    // 🔗 HOOK: stop sending audio
    // radioTransport.stopTx()
  }

  // ----------------------------------------------------------
  // CONNECT / DISCONNECT
  // ----------------------------------------------------------
  function connect() {
    setStatus(true);
    // 🔗 HOOK: radioTransport.connect()
  }

  function disconnect() {
    stopTalking();
    setStatus(false);
    // 🔗 HOOK: radioTransport.disconnect()
  }

  // ----------------------------------------------------------
  // BROADCAST HANDLING (PEERS / EVENTS)
  // ----------------------------------------------------------
  if (radioBus) {
    radioBus.onmessage = (event) => {
      const msg = event.data;
      if (!msg || msg.id === state.selfId) return;

      switch (msg.type) {
        case "join":
          state.peers.set(msg.id, {
            name: msg.name,
            channel: msg.channel,
            lastSeen: msg.ts
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
            lastSeen: msg.ts
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
  }

  // ----------------------------------------------------------
  // EVENTS
  // ----------------------------------------------------------
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

    // Spacebar PTT
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

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // INIT
  // ----------------------------------------------------------
  if (el.channelSelect) {
    setChannel(el.channelSelect.value);
  }
  setStatus(false);
  bindEvents();
  renderPeers();
  appendLog(`Radio widget ready as ${operatorName}`, "info");
})();
