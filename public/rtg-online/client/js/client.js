// ============================================================
// RTG Online — Client Unified JS
// ============================================================

const API = "https://api.realtreeguy.com/client";

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

// ============================================================
// LOGIN
// ============================================================

export async function login(email) {
  const data = await api("/login", "POST", { email });

  if (data.error) {
    alert("Login failed");
    return;
  }

  localStorage.setItem("client_id", data.user.id);
  window.location.href = "/pages/client/dashboard.html";
}

// ============================================================
// LOAD PROFILE
// ============================================================

export async function loadProfile() {
  const profile = await api("/me");
  document.getElementById("clientName").textContent = profile.name;
}

// ============================================================
// POST JOB
// ============================================================

export async function postJob(form) {
  const body = {
    title: form.title.value,
    description: form.description.value,
    budget: form.budget.value,
    flexible_budget: form.flexible.checked,
    best_days: form.best_days.value.split(","),
    best_time: form.best_time.value,
    address: form.address.value,
    photos: [] // add upload later
  };

  const data = await api("/job", "POST", body);

  if (data.ok) {
    window.location.href = "/pages/client/jobs.html";
  }
}

// ============================================================
// LOAD JOB LIST
// ============================================================

export async function loadJobs() {
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
      <button onclick="viewJob('${job.id}')">View</button>
    `;
    list.appendChild(div);
  });
}

// ============================================================
// VIEW JOB
// ============================================================

export async function viewJob(id) {
  window.location.href = `/pages/client/job-view.html?id=${id}`;
}

// ============================================================
// MESSAGES
// ============================================================

export async function loadMessages(jobId) {
  const msgs = await api(`/job/${jobId}/messages`);

  const box = document.getElementById("messageBox");
  box.innerHTML = "";

  msgs.forEach(m => {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<strong>${m.from_user}:</strong> ${m.message}`;
    box.appendChild(div);
  });
}

export async function sendMessage(jobId, text, toUser) {
  await api(`/job/${jobId}/message`, "POST", {
    message: text,
    to_user: toUser
  });

  loadMessages(jobId);
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function loadNotifications() {
  const notes = await api("/notifications");

  const box = document.getElementById("notifBox");
  box.innerHTML = "";

  notes.forEach(n => {
    const div = document.createElement("div");
    div.className = "notif";
    div.innerHTML = `
      <p>${n.message}</p>
      ${n.link ? `<a href="${n.link}">Open</a>` : ""}
    `;
    box.appendChild(div);
  });
}
