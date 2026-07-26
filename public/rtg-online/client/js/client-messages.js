// ============================================================
// CLIENT MESSAGING ENGINE — RTG Online (Client Version)
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

const CMSG = {
  clientId: null,
  treeGuys: [],
  threads: [],
  messages: [],
  activeThread: null,
  jobId: null,
  paid: false,
  allowedTreeGuys: [], // max 5 per job
};

// ============================================================
// INIT CLIENT MESSAGING
// ============================================================

export async function initClientMessaging(clientId, jobId, paid, allowedTreeGuys) {
  CMSG.clientId = clientId;
  CMSG.jobId = jobId;
  CMSG.paid = paid;
  CMSG.allowedTreeGuys = allowedTreeGuys || [];

  if (!paid) {
    renderLockedMessaging();
    return;
  }

  await loadThreads();
  await loadMessages();

  renderClientSidebar();
  autoRefreshClient();
}

// ============================================================
// LOADERS
// ============================================================

async function loadThreads() {
  CMSG.threads = await API.get(`/threads?user=${CMSG.clientId}`);
}

async function loadMessages() {
  CMSG.messages = await API.get(`/all?user=${CMSG.clientId}`);
}

// ============================================================
// RENDER SIDEBAR (Tree Guys Only)
// ============================================================

function renderClientSidebar() {
  const sidebar = document.getElementById("clientMessagesSidebar");
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="msg-cat">
      <h3>Your Tree Guys</h3>
      ${CMSG.allowedTreeGuys.map(tg => `
        <div class="msg-user" onclick="openClientThread('${tg.id}')">
          <img src="${tg.avatar_url || '/assets/img/default-user.png'}">
          <span>${tg.name}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================================
// LOCKED MESSAGING (Client Not Paid)
// ============================================================

function renderLockedMessaging() {
  const view = document.getElementById("clientMessagesView");
  if (!view) return;

  view.innerHTML = `
    <div class="locked-msg">
      <h2>Messaging Locked</h2>
      <p>You must complete payment to message tree guys.</p>
      <button onclick="window.location.href='/pages/client/billing.html'" 
              class="client-btn client-btn-primary">
        Complete Payment
      </button>
    </div>
  `;
}

// ============================================================
// OPEN THREAD
// ============================================================

window.openClientThread = async function (treeGuyId) {
  const thread = await API.get(`/thread?user=${CMSG.clientId}&other=${treeGuyId}`);
  CMSG.activeThread = thread;

  renderClientThread(thread);
};

// ============================================================
// RENDER THREAD
// ============================================================

function renderClientThread(thread) {
  const view = document.getElementById("clientMessagesView");
  if (!view) return;

  view.innerHTML = `
    <div class="thread-header">
      <h2>${thread.title}</h2>
    </div>

    <div class="thread-body">
      ${thread.messages.map(m => `
        <div class="msg-bubble ${m.from_user_id === CMSG.clientId ? 'me' : 'them'}">
          ${m.media_url ? `<img class="msg-media" src="${m.media_url}">` : ""}
          <p>${m.body}</p>
          <span class="msg-time">${formatTime(m.created_at)}</span>
        </div>
      `).join("")}
    </div>

    <div class="thread-input">
      <textarea id="clientMsgInput" placeholder="Type a message..."></textarea>
      <button onclick="sendClientMessage()">Send</button>
    </div>
  `;
}

// ============================================================
// SEND MESSAGE
// ============================================================

window.sendClientMessage = async function () {
  const input = document.getElementById("clientMsgInput");
  const text = input.value.trim();
  if (!text) return;

  await API.post(`/send`, {
    user_id: CMSG.clientId,
    thread_id: CMSG.activeThread.id,
    body: text
  });

  input.value = "";
  await loadMessages();
  await openClientThread(CMSG.activeThread.otherUserId);
};

// ============================================================
// AUTO REFRESH
// ============================================================

function autoRefreshClient() {
  setInterval(async () => {
    if (!CMSG.activeThread) return;

    await loadMessages();
    await openClientThread(CMSG.activeThread.otherUserId);
  }, 5000);
}

// ============================================================
// UTIL
// ============================================================

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
