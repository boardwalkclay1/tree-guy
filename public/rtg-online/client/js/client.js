// ============================================================
// RTG Online — Client Unified JS (Worker-Based, Cleaned Up)
// ============================================================

// CLIENT WORKER BASE
const API = "https://api.realtreeguy.com/client";

// GLOBAL MESSAGING WORKER BASE
const MSG_API = "/rtg/api/messages";

// ============================================================
// API WRAPPERS
// ============================================================

async function api(path, method = "GET", body = null) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": localStorage.getItem("client_id") || ""
    },
    body: body ? JSON.stringify(body) : null
  });

  try {
    return await res.json();
  } catch {
    return { ok: false };
  }
}

async function msgGet(path) {
  const r = await fetch(MSG_API + path);
  try {
    return await r.json();
  } catch {
    return [];
  }
}

async function msgPost(path, body) {
  const r = await fetch(MSG_API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  try {
    return await r.json();
  } catch {
    return { ok: false };
  }
}

// ============================================================
// PAGE ROUTER
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  switch (page) {
    case "login":
      initLogin();
      break;

    case "dashboard":
      loadClientName();
      loadDashboardJobs();
      loadNotifications();
      break;

    case "post-job":
      loadClientName();
      initPostJob();
      break;

    case "jobs":
      loadClientName();
      loadJobs();
      break;

    case "messages":
      loadClientName();
      initClientMessagingPage();
      break;

    case "contracts":
      loadClientName();
      loadContracts();
      break;

    case "billing":
      loadClientName();
      loadBilling();
      break;

    case "settings":
      loadClientName();
      loadSettings();
      break;
  }
});

// ============================================================
// LOGIN
// ============================================================

function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const data = await api("/login", "POST", { email, password });

    if (!data || !data.ok || !data.user) {
      alert("Invalid email or password");
      return;
    }

    localStorage.setItem("client_id", data.user.id);
    localStorage.setItem("client_name", data.user.name || "Client");

    // RTG Online client dashboard path
    window.location.href = "/rtg-online/client/pages/client-dashboard.html";
  });
}

// ============================================================
// LOAD CLIENT NAME
// ============================================================

async function loadClientName() {
  const el = document.getElementById("clientTopName");
  if (!el) return;

  const profile = await api("/me");
  el.textContent = (profile && profile.name) ? profile.name : (localStorage.getItem("client_name") || "Client");
}

// ============================================================
// POST JOB
// ============================================================

function initPostJob() {
  const form = document.getElementById("postJobForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      title: form.title.value,
      description: form.description.value,
      budget: form.budget.value,
      flexible_budget: form.flexible.checked,
      best_days: form.best_days.value
        ? form.best_days.value.split(",").map(d => d.trim())
        : [],
      best_time: form.best_time.value,
      address: form.address.value,
      photos: [] // hook in later
    };

    const data = await api("/job", "POST", body);

    if (data && data.ok) {
      window.location.href = "/rtg-online/client/pages/client-jobs.html";
    } else {
      alert("Failed to post job.");
    }
  });
}

// ============================================================
// LOAD JOB LIST
// ============================================================

async function loadJobs() {
  const list = document.getElementById("jobList");
  if (!list) return;

  const jobs = await api("/jobs");
  if (!Array.isArray(jobs)) {
    list.innerHTML = "<p>No jobs found.</p>";
    return;
  }

  list.innerHTML = "";

  jobs.forEach(job => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description || ""}</p>
      <p><strong>Budget:</strong> $${job.budget || "0"}</p>
      <p><strong>Status:</strong> ${job.status || "unknown"}</p>
      <button class="client-btn client-btn-primary" onclick="viewJob('${job.id}')">View</button>
    `;
    list.appendChild(div);
  });
}

function viewJob(id) {
  window.location.href = `/rtg-online/client/pages/client-job-view.html?id=${id}`;
}

// ============================================================
// DASHBOARD JOBS
// ============================================================

async function loadDashboardJobs() {
  const box = document.getElementById("dashboardJobs");
  if (!box) return;

  const jobs = await api("/jobs");
  if (!Array.isArray(jobs) || !jobs.length) {
    box.innerHTML = "<p>No jobs yet.</p>";
    return;
  }

  box.innerHTML = "";

  jobs.slice(0, 5).forEach(job => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description || ""}</p>
      <p><strong>Status:</strong> ${job.status || "unknown"}</p>
    `;
    box.appendChild(div);
  });
}

// ============================================================
// MESSAGES (GLOBAL SYSTEM)
// ============================================================

async function initClientMessagingPage() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");
  const clientId = localStorage.getItem("client_id");

  if (!jobId || !clientId) return;

  const allowed = await api(`/job/${jobId}/allowed-tree-guys`);
  const billing = await api(`/billing/status`);

  const treeGuys = (allowed && allowed.treeGuys) ? allowed.treeGuys : [];
  const paid = billing && billing.paid;

  // This assumes you have a global messaging initializer elsewhere
  if (typeof initClientMessaging === "function") {
    initClientMessaging(clientId, jobId, paid, treeGuys);
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

async function loadNotifications() {
  const box = document.getElementById("notifBox");
  if (!box) return;

  const notes = await api("/notifications");
  if (!Array.isArray(notes) || !notes.length) {
    box.innerHTML = "<p>No notifications.</p>";
    return;
  }

  box.innerHTML = "";

  notes.forEach(n => {
    const div = document.createElement("div");
    div.className = "notif";
    div.innerHTML = `
      <p>${n.message}</p>
      ${n.link ? `<a href="${n.link}" class="client-btn client-btn-secondary">Open</a>` : ""}
    `;
    box.appendChild(div);
  });
}

// ============================================================
// CONTRACTS
// ============================================================

async function loadContracts() {
  const list = document.getElementById("contractList");
  if (!list) return;

  const contracts = await api("/contracts");
  if (!Array.isArray(contracts) || !contracts.length) {
    list.innerHTML = "<p>No contracts yet.</p>";
    return;
  }

  list.innerHTML = "";

  contracts.forEach(c => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <h3>Contract for Job #${c.job_id}</h3>
      <p>${c.contract_type || "Tree Work Contract"}</p>
      <button class="client-btn client-btn-primary" onclick="openContract('${c.id}')">Open</button>
    `;
    list.appendChild(div);
  });
}

function openContract(id) {
  window.location.href = `/rtg-online/client/pages/client-contract-view.html?id=${id}`;
}

// ============================================================
// BILLING
// ============================================================

async function loadBilling() {
  const box = document.getElementById("billingHistory");
  if (!box) return;

  const bills = await api("/billing");
  if (!Array.isArray(bills) || !bills.length) {
    box.innerHTML = "<p>No billing history.</p>";
    return;
  }

  box.innerHTML = "";

  bills.forEach(b => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <h3>${b.type}</h3>
      <p><strong>Amount:</strong> $${b.amount || "0"}</p>
      <p><strong>Date:</strong> ${b.created_at ? new Date(b.created_at).toLocaleDateString() : "N/A"}</p>
    `;
    box.appendChild(div);
  });
}

// ============================================================
// SETTINGS
// ============================================================

async function loadSettings() {
  const profile = await api("/me");
  if (!profile) return;

  const nameEl = document.getElementById("settingsName");
  const emailEl = document.getElementById("settingsEmail");
  const phoneEl = document.getElementById("settingsPhone");
  const addrEl = document.getElementById("settingsAddress");
  const form = document.getElementById("settingsProfileForm");

  if (!form) return;

  if (nameEl) nameEl.value = profile.name || "";
  if (emailEl) emailEl.value = profile.email || "";
  if (phoneEl) phoneEl.value = profile.phone || "";
  if (addrEl) addrEl.value = profile.address || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      name: nameEl ? nameEl.value : "",
      email: emailEl ? emailEl.value : "",
      phone: phoneEl ? phoneEl.value : "",
      address: addrEl ? addrEl.value : ""
    };

    const res = await api("/settings/profile", "POST", body);

    if (res && res.ok) {
      alert("Profile updated");
      localStorage.setItem("client_name", body.name || "Client");
      loadClientName();
    } else {
      alert("Failed to update profile.");
    }
  });
}
