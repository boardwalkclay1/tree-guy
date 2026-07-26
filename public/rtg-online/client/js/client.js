// ============================================================
// RTG Online — Client Unified JS (Updated for Global Messaging)
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

  return res.json();
}

async function msgGet(path) {
  const r = await fetch(MSG_API + path);
  return r.json();
}

async function msgPost(path, body) {
  const r = await fetch(MSG_API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const data = await api("/login", "POST", { email, password });

    if (!data.ok) {
      alert("Invalid email or password");
      return;
    }

    localStorage.setItem("client_id", data.user.id);
    window.location.href = "/pages/client/dashboard.html";
  });
}

// ============================================================
// LOAD CLIENT NAME
// ============================================================

async function loadClientName() {
  const profile = await api("/me");
  const el = document.getElementById("clientTopName");
  if (el) el.textContent = profile.name || "Client";
}

// ============================================================
// POST JOB
// ============================================================

function initPostJob() {
  const form = document.getElementById("postJobForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      title: form.title.value,
      description: form.description.value,
      budget: form.budget.value,
      flexible_budget: form.flexible.checked,
      best_days: form.best_days.value.split(",").map(d => d.trim()),
      best_time: form.best_time.value,
      address: form.address.value,
      photos: []
    };

    const data = await api("/job", "POST", body);

    if (data.ok) {
      window.location.href = "/pages/client/jobs.html";
    }
  });
}

// ============================================================
// LOAD JOB LIST
// ============================================================

async function loadJobs() {
  const jobs = await api("/jobs");
  const list = document.getElementById("jobList");
  list.innerHTML = "";

  jobs.forEach(job => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description}</p>
      <p><strong>Budget:</strong> $${job.budget}</p>
      <p><strong>Status:</strong> ${job.status}</p>
      <button class="client-btn client-btn-primary" onclick="viewJob('${job.id}')">View</button>
    `;
    list.appendChild(div);
  });
}

function viewJob(id) {
  window.location.href = `/pages/client/job-view.html?id=${id}`;
}

// ============================================================
// DASHBOARD JOBS
// ============================================================

async function loadDashboardJobs() {
  const jobs = await api("/jobs");
  const box = document.getElementById("dashboardJobs");
  if (!box) return;

  box.innerHTML = "";

  jobs.slice(0, 5).forEach(job => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description}</p>
      <p><strong>Status:</strong> ${job.status}</p>
    `;
    box.appendChild(div);
  });
}

// ============================================================
// MESSAGES (NEW GLOBAL SYSTEM)
// ============================================================

async function initClientMessagingPage() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");

  const clientId = localStorage.getItem("client_id");

  // Get allowed tree guys (max 5)
  const allowed = await api(`/job/${jobId}/allowed-tree-guys`);

  // Check payment status
  const billing = await api(`/billing/status`);

  // Initialize client messaging engine
  initClientMessaging(clientId, jobId, billing.paid, allowed.treeGuys);
}

// ============================================================
// NOTIFICATIONS
// ============================================================

async function loadNotifications() {
  const notes = await api("/notifications");
  const box = document.getElementById("notifBox");
  if (!box) return;

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
  window.location.href = `/pages/client/contract-view.html?id=${id}`;
}

// ============================================================
// BILLING
// ============================================================

async function loadBilling() {
  const box = document.getElementById("billingHistory");
  if (!box) return;

  const bills = await api("/billing");

  box.innerHTML = "";

  bills.forEach(b => {
    const div = document.createElement("div");
    div.className = "job-card";
    div.innerHTML = `
      <h3>${b.type}</h3>
      <p><strong>Amount:</strong> $${b.amount}</p>
      <p><strong>Date:</strong> ${new Date(b.created_at).toLocaleDateString()}</p>
    `;
    box.appendChild(div);
  });
}

// ============================================================
// SETTINGS
// ============================================================

async function loadSettings() {
  const profile = await api("/me");

  document.getElementById("settingsName").value = profile.name || "";
  document.getElementById("settingsEmail").value = profile.email || "";
  document.getElementById("settingsPhone").value = profile.phone || "";
  document.getElementById("settingsAddress").value = profile.address || "";

  document.getElementById("settingsProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      name: settingsName.value,
      email: settingsEmail.value,
      phone: settingsPhone.value,
      address: settingsAddress.value
    };

    const res = await api("/settings/profile", "POST", body);

    if (res.ok) alert("Profile updated");
  });
}
