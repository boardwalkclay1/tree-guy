// ============================================================
// REAL TREE GUY OS — CUSTOMERS & JOBS (D1 VERSION, UPGRADED)
// ============================================================

// -----------------------------
// API HELPERS (Safe Mode)
// -----------------------------
async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn("Non‑JSON from", url, text.slice(0, 120));
      return null;
    }
  } catch (err) {
    console.error("Fetch failed:", url, err);
    return null;
  }
}

async function apiGetCustomers() {
  return await safeFetch("/api/customers") || [];
}

async function apiAddCustomer(cust) {
  return await safeFetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cust)
  });
}

async function apiDeleteCustomer(id) {
  return await safeFetch(`/api/customers?id=${id}`, { method: "DELETE" });
}

async function apiGetJobs() {
  return await safeFetch("/api/jobs") || [];
}

async function apiAddJob(job) {
  return await safeFetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job)
  });
}

async function apiDeleteJob(id) {
  return await safeFetch(`/api/jobs?id=${id}`, { method: "DELETE" });
}

// -----------------------------
// TABS (Upgraded for dual-panel layout)
// -----------------------------
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
// CUSTOMERS (Upgraded)
// ============================================================
async function renderCustomers() {
  const ul = document.getElementById("custList");
  const customers = await apiGetCustomers();

  if (!customers.length) {
    ul.innerHTML = `<li class="empty-note">No customers saved yet.</li>`;
    return;
  }

  ul.innerHTML = customers.map(c => `
    <li>
      <button class="del-btn" data-id="${c.id}" data-type="cust">✕</button>
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

  // Delete buttons
  ul.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = async () => {
      await apiDeleteCustomer(btn.dataset.id);
      renderCustomers();
    };
  });

  // Calendar linking
  ul.querySelectorAll(".btn-link-calendar").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      localStorage.setItem("rtgCalendarCustomer", id);
      localStorage.setItem("rtgCalendarCustomerName", name);
      window.location.href = "../../pages/calendar.html";
    };
  });

  // Contract linking
  ul.querySelectorAll(".btn-link-contract").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      localStorage.setItem("rtgContractCustomer", id);
      localStorage.setItem("rtgContractCustomerName", name);
      window.location.href = "../../pages/contracts.html";
    };
  });
}

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
// JOBS (Upgraded)
// ============================================================
async function renderJobs() {
  const ul = document.getElementById("jobList");
  const jobs = await apiGetJobs();

  if (!jobs.length) {
    ul.innerHTML = `<li class="empty-note">No jobs saved yet.</li>`;
    return;
  }

  ul.innerHTML = jobs.map(j => `
    <li>
      <button class="del-btn" data-id="${j.id}" data-type="job">✕</button>

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

  // Delete buttons
  ul.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = async () => {
      await apiDeleteJob(btn.dataset.id);
      renderJobs();
    };
  });

  // Calendar linking
  ul.querySelectorAll(".btn-link-calendar").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      localStorage.setItem("rtgCalendarJob", id);
      localStorage.setItem("rtgCalendarJobTitle", title);
      window.location.href = "../../pages/calendar.html";
    };
  });

  // Contract linking
  ul.querySelectorAll(".btn-link-contract").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      localStorage.setItem("rtgContractJob", id);
      localStorage.setItem("rtgContractJobTitle", title);
      window.location.href = "../../pages/contracts.html";
    };
  });
}

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
// INITIAL RENDER
// ============================================================
renderCustomers();
renderJobs();
