// ============================================================
// REAL TREE GUY OS — CUSTOMERS & JOBS (FINAL VERSION)
// ============================================================

// ------------------------------------------------------------
// API BASE — ALWAYS HIT YOUR WORKER DOMAIN
// ------------------------------------------------------------
const API_BASE = "https://api.realtreeguy.com/api";

// ------------------------------------------------------------
// SAFE JSON FETCH (HTML → null)
// ------------------------------------------------------------
async function safeFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;

  try {
    const res = await fetch(url, opts);
    const text = await res.text();

    // If HTML is returned → Worker route failed → return null
    if (text.trim().startsWith("<")) {
      console.warn("Non‑JSON from", url, text.slice(0, 120));
      return null;
    }

    return JSON.parse(text);
  } catch (err) {
    console.error("Fetch failed:", url, err);
    return null;
  }
}

// ------------------------------------------------------------
// API WRAPPERS
// ------------------------------------------------------------
async function apiGetCustomers() {
  return (await safeFetch("/customers")) || [];
}

async function apiAddCustomer(cust) {
  return await safeFetch("/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cust)
  });
}

async function apiDeleteCustomer(id) {
  return await safeFetch(`/customers?id=${id}`, { method: "DELETE" });
}

async function apiGetJobs() {
  return (await safeFetch("/jobs")) || [];
}

async function apiAddJob(job) {
  return await safeFetch("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job)
  });
}

async function apiDeleteJob(id) {
  return await safeFetch(`/jobs?id=${id}`, { method: "DELETE" });
}

// ------------------------------------------------------------
// TABS (Dual‑Panel Layout)
// ------------------------------------------------------------
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = {
  customers: ["tab-customers", "tab-customers-list"],
  jobs: ["tab-jobs", "tab-jobs-list"]
};

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.tab;

    Object.values(panels).flat().forEach(id => {
      document.getElementById(id).classList.remove("active");
    });

    panels[target].forEach(id => {
      document.getElementById(id).classList.add("active");
    });
  });
});

// Escape HTML
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

// ============================================================
// CUSTOMERS — RENDER
// ============================================================
async function renderCustomers() {
  const ul = document.getElementById("custList");
  const customers = await apiGetCustomers();

  if (!customers || !customers.length) {
    ul.innerHTML = `<li class="empty-note">No customers saved yet.</li>`;
    return;
  }

  ul.innerHTML = customers.map(c => `
    <li>
      <button class="del-btn" data-id="${c.id}">✕</button>

      <div class="cust-name">${esc(c.name)}</div>
      <div class="cust-details">
        ${esc(c.phone)} · ${esc(c.email)}<br>
        ${esc(c.address)}<br>
        ${esc(c.notes)}
      </div>

      <div class="link-row">
        <button class="btn-link-calendar" data-id="${c.id}" data-name="${esc(c.name)}">Calendar</button>
        <button class="btn-link-contract" data-id="${c.id}" data-name="${esc(c.name)}">Contract</button>
      </div>
    </li>
  `).join("");

  // Delete
  ul.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = async () => {
      await apiDeleteCustomer(btn.dataset.id);
      renderCustomers();
    };
  });

  // Calendar link
  ul.querySelectorAll(".btn-link-calendar").forEach(btn => {
    btn.onclick = () => {
      localStorage.setItem("rtgCalendarCustomer", btn.dataset.id);
      localStorage.setItem("rtgCalendarCustomerName", btn.dataset.name);
      window.location.href = "../../pages/calendar.html";
    };
  });

  // Contract link
  ul.querySelectorAll(".btn-link-contract").forEach(btn => {
    btn.onclick = () => {
      localStorage.setItem("rtgContractCustomer", btn.dataset.id);
      localStorage.setItem("rtgContractCustomerName", btn.dataset.name);
      window.location.href = "../../pages/contracts.html";
    };
  });
}

// Add Customer
document.getElementById("addCust").onclick = async () => {
  const name = document.getElementById("custName").value.trim();
  if (!name) return alert("Name required.");

  const customer = {
    id: crypto.randomUUID(),
    name,
    phone: document.getElementById("custPhone").value.trim(),
    email: document.getElementById("custEmail").value.trim(),
    address: document.getElementById("custAddress").value.trim(),
    notes: document.getElementById("custNotes").value.trim()
  };

  await apiAddCustomer(customer);
  renderCustomers();

  ["custName","custPhone","custEmail","custAddress","custNotes"]
    .forEach(id => document.getElementById(id).value = "");
};

// ============================================================
// JOBS — RENDER
// ============================================================
async function renderJobs() {
  const ul = document.getElementById("jobList");
  const jobs = await apiGetJobs();

  if (!jobs || !jobs.length) {
    ul.innerHTML = `<li class="empty-note">No jobs saved yet.</li>`;
    return;
  }

  ul.innerHTML = jobs.map(j => `
    <li>
      <button class="del-btn" data-id="${j.id}">✕</button>

      <div class="job-title">
        ${esc(j.title)}
        <span class="badge badge-${j.status}">${j.status}</span>
      </div>

      <div class="job-details">
        ${j.customer ? `Customer: ${esc(j.customer)} · ` : ""}
        ${esc(j.date)} · ${esc(j.price)}
        <br>${esc(j.notes)}
      </div>

      <div class="link-row">
        <button class="btn-link-calendar" data-id="${j.id}" data-title="${esc(j.title)}">Calendar</button>
        <button class="btn-link-contract" data-id="${j.id}" data-title="${esc(j.title)}">Contract</button>
      </div>
    </li>
  `).join("");

  // Delete
  ul.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = async () => {
      await apiDeleteJob(btn.dataset.id);
      renderJobs();
    };
  });

  // Calendar link
  ul.querySelectorAll(".btn-link-calendar").forEach(btn => {
    btn.onclick = () => {
      localStorage.setItem("rtgCalendarJob", btn.dataset.id);
      localStorage.setItem("rtgCalendarJobTitle", btn.dataset.title);
      window.location.href = "../../pages/calendar.html";
    };
  });

  // Contract link
  ul.querySelectorAll(".btn-link-contract").forEach(btn => {
    btn.onclick = () => {
      localStorage.setItem("rtgContractJob", btn.dataset.id);
      localStorage.setItem("rtgContractJobTitle", btn.dataset.title);
      window.location.href = "../../pages/contracts.html";
    };
  });
}

// Add Job
document.getElementById("addJob").onclick = async () => {
  const title = document.getElementById("jobTitle").value.trim();
  if (!title) return alert("Job title required.");

  const job = {
    id: crypto.randomUUID(),
    title,
    customer: document.getElementById("jobCust").value.trim(),
    date: document.getElementById("jobDate").value,
    price: document.getElementById("jobPrice").value.trim(),
    status: document.getElementById("jobStatus").value,
    notes: document.getElementById("jobNotes").value.trim()
  };

  await apiAddJob(job);
  renderJobs();

  ["jobTitle","jobCust","jobDate","jobPrice","jobStatus","jobNotes"]
    .forEach(id => document.getElementById(id).value = "");
};

// ============================================================
// INITIAL LOAD
// ============================================================
renderCustomers();
renderJobs();
