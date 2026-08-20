// ============================================================
// REAL TREE GUY OS — GLOBAL NOTIFICATION FRONTEND
// ============================================================

const NOTIFY_API_BASE = "https://api.realtreeguy.com/api/notify";

const rtgUserId = localStorage.getItem("rtgUserId") || "dev";
const rtgUserEmail = localStorage.getItem("rtgUserEmail") || "dev@local";
const rtgUserType = localStorage.getItem("rtgUserType") || "tree";

const notifyBadgeEl = document.getElementById("rtgNotifyBadge");
const notifyListEl = document.getElementById("rtgNotifyList");

// ============================================================
// SAFE JSON
// ============================================================
async function notifySafeJson(res) {
  const text = await res.text();
  if (!text || text.trim().startsWith("<")) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ============================================================
// API WRAPPER
// ============================================================
const NotifyAPI = {
  headers() {
    return {
      "Content-Type": "application/json",
      "X-RTG-User": rtgUserId,
      "X-RTG-Email": rtgUserEmail,
      "X-RTG-Type": rtgUserType
    };
  },

  async list() {
    const url = `${NOTIFY_API_BASE}/list?user_id=${encodeURIComponent(rtgUserId)}`;
    try {
      const res = await fetch(url, { headers: this.headers() });
      return await notifySafeJson(res);
    } catch {
      return null;
    }
  },

  async create(payload) {
    const url = `${NOTIFY_API_BASE}/create`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(payload)
      });
      return await notifySafeJson(res);
    } catch {
      return null;
    }
  },

  async markRead(id) {
    const url = `${NOTIFY_API_BASE}/read`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ id })
      });
      return await notifySafeJson(res);
    } catch {
      return null;
    }
  },

  async clearAll() {
    const url = `${NOTIFY_API_BASE}/clear`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ user_id: rtgUserId })
      });
      return await notifySafeJson(res);
    } catch {
      return null;
    }
  }
};

// ============================================================
// RENDER HELPERS
// ============================================================
function renderBadge(notifications) {
  if (!notifyBadgeEl) return;
  const unread = notifications.filter(n => !n.read).length;
  notifyBadgeEl.textContent = unread > 0 ? String(unread) : "";
  notifyBadgeEl.classList.toggle("rtg-notify-badge--active", unread > 0);
}

function renderList(notifications) {
  if (!notifyListEl) return;

  if (!notifications.length) {
    notifyListEl.innerHTML = `<div class="rtg-notify-empty">No notifications.</div>`;
    return;
  }

  notifyListEl.innerHTML = notifications
    .map(n => {
      const ts = new Date(n.created_at).toLocaleTimeString();
      const cls = n.read ? "rtg-notify-item rtg-notify-item--read"
                         : "rtg-notify-item rtg-notify-item--unread";

      return `
        <div class="${cls}" data-notify-id="${n.id}">
          <div class="rtg-notify-title">${n.title || "Notification"}</div>
          <div class="rtg-notify-message">${n.message || ""}</div>
          <div class="rtg-notify-meta">
            <span class="rtg-notify-type">${n.type}</span>
            <span class="rtg-notify-time">${ts}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

// ============================================================
// LOAD + REFRESH
// ============================================================
async function loadNotifications() {
  const data = await NotifyAPI.list();
  if (!data) return;

  renderBadge(data);
  renderList(data);
}

// ============================================================
// GLOBAL CREATE FUNCTION (USED BY OTHER JS FILES)
// ============================================================
export async function rtgNotify(title, message, options = {}) {
  const payload = {
    user_id: options.user_id || rtgUserId,
    scope: options.scope || "user",
    type: options.type || "info",
    title,
    message,
    data: options.data || {}
  };

  const res = await NotifyAPI.create(payload);
  if (res && res.ok) {
    loadNotifications();
  }
}

// ============================================================
// CLICK HANDLERS (MARK READ)
// ============================================================
function bindNotificationClicks() {
  if (!notifyListEl) return;

  notifyListEl.addEventListener("click", async (e) => {
    const item = e.target.closest("[data-notify-id]");
    if (!item) return;

    const id = item.dataset.notifyId;
    await NotifyAPI.markRead(id);
    loadNotifications();
  });

  const clearBtn = document.getElementById("rtgNotifyClear");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      await NotifyAPI.clearAll();
      loadNotifications();
    });
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadNotifications();
  bindNotificationClicks();
});
