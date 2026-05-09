(function () {
  const el = {
    status: document.getElementById("radio-status"),
    channelSelect: document.getElementById("radio-channel"),
    connectBtn: document.getElementById("radio-connect"),
    disconnectBtn: document.getElementById("radio-disconnect"),
    pttBtn: document.getElementById("radio-ptt"),
    channelDisplay: document.getElementById("radio-channel-display"),
    log: document.getElementById("radio-log"),
  };

  const state = {
    connected: false,
    channel: el.channelSelect ? el.channelSelect.value : "1",
    talking: false,
  };

  function setStatus(connected) {
    state.connected = connected;

    if (!el.status) return;

    el.status.textContent = connected ? "Connected" : "Disconnected";
    el.status.classList.toggle("radio-status--connected", connected);
    el.status.classList.toggle("radio-status--disconnected", !connected);

    if (el.connectBtn) el.connectBtn.disabled = connected;
    if (el.disconnectBtn) el.disconnectBtn.disabled = !connected;
    if (el.pttBtn) el.pttBtn.disabled = !connected;
  }

  function setChannel(channel) {
    state.channel = channel;
    if (el.channelDisplay) {
      el.channelDisplay.textContent = `Channel: ${channel}`;
    }
    log(`Switched to channel ${channel}`);
    // 🔗 HOOK: here’s where you’d tell your transport layer to change channel
    // radioTransport.setChannel(channel)
  }

  function log(message) {
    if (!el.log) return;
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    el.log.textContent = `[${ts}] ${message}`;
  }

  function startTalking() {
    if (!state.connected || state.talking) return;
    state.talking = true;
    if (el.pttBtn) {
      el.pttBtn.classList.add("radio-ptt-btn--active");
      el.pttBtn.textContent = "Talking…";
    }
    log(`Transmitting on channel ${state.channel}`);
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
    log(`Stopped transmitting`);
    // 🔗 HOOK: stop sending audio
    // radioTransport.stopTx()
  }

  function connect() {
    // For now this is UI-only; later we wire in real connection logic.
    setStatus(true);
    log(`Connected on channel ${state.channel}`);
    // 🔗 HOOK: radioTransport.connect()
  }

  function disconnect() {
    stopTalking();
    setStatus(false);
    log("Disconnected");
    // 🔗 HOOK: radioTransport.disconnect()
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
      // Mouse / touch hold-to-talk
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

    // Optional: spacebar as PTT when widget focused
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

  // Public API for dashboard integration
  window.RTGRadio = {
    connect,
    disconnect,
    setChannel,
    getState() {
      return { ...state };
    },
  };

  // Init
  if (el.channelSelect) {
    setChannel(el.channelSelect.value);
  }
  setStatus(false);
  bindEvents();
})();
