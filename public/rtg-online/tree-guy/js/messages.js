// ============================================================
// REAL TREE GUY OS — GLOBAL MESSAGING ENGINE
// ============================================================

// API WRAPPER
const API = {
  async get(path) {
    const r = await fetch(`/rtg/api/messages${path}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`/rtg/api/messages${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return r.json();
  }
};

// ============================================================
// GLOBAL STATE
// ============================================================

const MSG = {
  userId: null,          // logged-in user
  clients: [],           // category 1
  lumberjacks: [],       // category 2
  squads: [],            // category 3
  threads: [],           // all threads
  messages: [],          // all messages
  activeThread: null,    // currently opened thread
};

// ============================================================
// INITIALIZE MESSAGING SYSTEM
// ============================================================

export async function initMessaging(userId) {
  MSG.userId = userId;

  await loadCategories();
  await loadThreads();
  await loadMessages();

  renderMessageSidebar();
  autoRefresh();
}

// ============================================================
// LOADERS
// ============================================================

// Load clients, lumberjacks, squads
async function loadCategories() {
  const data = await API.get(`/categories?user=${MSG.userId}`);

  MSG.clients = data.clients;
  MSG.lumberjacks = data.lumberjacks;
  MSG.squads = data.squads;
}

// Load all threads
async function loadThreads() {
  MSG.threads = await API.get(`/threads?user=${MSG.userId}`);
}

// Load all messages
async function loadMessages() {
  MSG.messages = await API.get(`/all?user=${MSG.userId}`);
}

// ============================================================
// RENDER SIDEBAR (Clients / Lumberjacks / Squads)
// ============================================================

function renderMessageSidebar() {
  const sidebar = document.getElementById("messagesSidebar");
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="msg-cat">
      <h3>Clients</h3>
      ${MSG.clients.map(c => `
        <div class="msg-user" onclick="openThread('${c.id}')">
          <img src="${c.avatar_url || '/assets/img/default-user.png'}">
          <span>${c.name}</span>
        </div>
      `).join("")}
    </div>

    <div class="msg-cat">
      <h3>Lumberjacks</h3>
      ${MSG.lumberjacks.map(l => `
        <div class="msg-user" onclick="openThread('${l.id}')">
          <img src="${l.avatar_url || '/assets/img/default-user.png'}">
          <span>${l.name}</span>
        </div>
      `).join("")}
    </div>

    <div class="msg-cat">
      <h3>LumberSquads</h3>
      ${MSG.squads.map(s => `
        <div class="msg-user" onclick="openSquad('${s.id}')">
          <img src="/assets/img/squad.png">
          <span>${s.name}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================================
// OPEN DIRECT THREAD
// ============================================================

window.openThread = async function (otherUserId) {
  const thread = await API.get(`/thread?user=${MSG.userId}&other=${otherUserId}`);
  MSG.activeThread = thread;

  renderThread(thread);
};

// ============================================================
// OPEN SQUAD THREAD
// ============================================================

window.openSquad = async function (squadId) {
  const thread = await API.get(`/squad?user=${MSG.userId}&squad=${squadId}`);
  MSG.activeThread = thread;

  renderThread(thread);
};

// ============================================================
// RENDER THREAD
// ============================================================

function renderThread(thread) {
  const view = document.getElementById("messagesView");
  if (!view) return;

  view.innerHTML = `
    <div class="thread-header">
      <h2>${thread.title}</h2>
    </div>

    <div class="thread-body">
      ${thread.messages.map(m => `
        <div class="msg-bubble ${m.from_user_id === MSG.userId ? 'me' : 'them'}">
          ${m.media_url ? `<img class="msg-media" src="${m.media_url}">` : ""}
          <p>${m.body}</p>
          <span class="msg-time">${formatTime(m.created_at)}</span>
        </div>
      `).join("")}
    </div>

    <div class="thread-input">
      <textarea id="msgInput" placeholder="Type a message..."></textarea>
      <button onclick="sendMessage()">Send</button>
    </div>
  `;
}

// ============================================================
// SEND MESSAGE
// ============================================================

window.sendMessage = async function () {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  await API.post(`/send`, {
    user_id: MSG.userId,
    thread_id: MSG.activeThread.id,
    body: text
  });

  input.value = "";
  await loadMessages();
  await openThread(MSG.activeThread.otherUserId || MSG.activeThread.squadId);
};

// ============================================================
// AUTO REFRESH
// ============================================================

function autoRefresh() {
  setInterval(async () => {
    if (!MSG.activeThread) return;

    await loadMessages();
    await openThread(MSG.activeThread.otherUserId || MSG.activeThread.squadId);
  }, 5000);
}

// ============================================================
// UTIL
// ============================================================

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
