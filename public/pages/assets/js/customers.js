// ============================================================
// Real Tree Guy OS — Customers & Jobs (IndexedDB Version)
// ============================================================

import { initDB, save, getAll, remove } from "../../assets/js/db.js";

await initDB();

// ============================================================
// TABS
// ============================================================

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// Escape HTML
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

// ============================================================
// CUSTOMERS
// ============================================================

async function renderCustomers() {
  const ul = document.getElementById("custList");
  const customers = await getAll("customers");

  if (!customers || customers.length === 0) {
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
    </li>
  `).join("");

  ul.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = async () => {
      await remove("customers", btn.dataset.id);
      renderCustomers();
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

  await save("customers", customer);
  renderCustomers();

  ["custName","custPhone","custEmail","custAddress","custNotes"]
    .forEach(id => document.getElementById(id).value = "");
};

// ============================================================
// JOBS
// ============================================================

async function renderJobs() {
  const ul = document.getElementById("jobList");
  const jobs = await getAll("jobs");

  if (!jobs || jobs.length === 0) {
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
    </li>
  `).join("");

  ul.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = async () => {
      await remove("jobs", btn.dataset.id);
      renderJobs();
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

  await save("jobs", job);
  renderJobs();

  ["jobTitle","jobCust","jobDate","jobPrice","jobStatus","jobNotes"]
    .forEach(id => document.getElementById(id).value = "");
};

// ============================================================
// INITIAL RENDER
// ============================================================

renderCustomers();
renderJobs();
