// Tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// Keys
const CUST_KEY = "rtg_customers_v1";
const JOB_KEY  = "rtg_jobs_v1";

// Load
let customers = JSON.parse(localStorage.getItem(CUST_KEY) || "[]");
let jobs      = JSON.parse(localStorage.getItem(JOB_KEY)  || "[]");

// Escape HTML
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

/* -------------------------
   CUSTOMERS
------------------------- */

function renderCustomers() {
  const ul = document.getElementById("custList");

  if (customers.length === 0) {
    ul.innerHTML = `<li class="empty-note">No customers saved yet.</li>`;
    return;
  }

  ul.innerHTML = customers.map((c, i) => `
    <li>
      <button class="del-btn" data-i="${i}" data-type="cust">✕</button>
      <div class="cust-name">${esc(c.name)}</div>
      <div class="cust-details">
        ${esc(c.phone)} · ${esc(c.email)}<br>
        ${esc(c.address)}<br>
        ${esc(c.notes)}
      </div>
    </li>
  `).join("");

  ul.querySelectorAll(".del-btn").forEach(btn => {
    btn.onclick = () => {
      customers.splice(Number(btn.dataset.i), 1);
      localStorage.setItem(CUST_KEY, JSON.stringify(customers));
      renderCustomers();
    };
  });
}

document.getElementById("addCust").onclick = () => {
  const name = document.getElementById("custName").value.trim();
  if (!name) return alert("Name required.");

  customers.push({
    name,
    phone: document.getElementById("custPhone").value.trim(),
    email: document.getElementById("custEmail").value.trim(),
    address: document.getElementById("custAddress").value.trim(),
    notes: document.getElementById("custNotes").value.trim()
  });

  localStorage.setItem(CUST_KEY, JSON.stringify(customers));
  renderCustomers();

  ["custName","custPhone","custEmail","custAddress","custNotes"]
    .forEach(id => document.getElementById(id).value = "");
};

/* -------------------------
   JOBS
------------------------- */

function renderJobs() {
  const ul = document.getElementById("jobList");

  if (jobs.length === 0) {
    ul.innerHTML = `<li class="empty-note">No jobs saved yet.</li>`;
    return;
  }

  ul.innerHTML = jobs.map((j, i) => `
    <li>
      <button class="del-btn" data-i="${i}" data-type="job">✕</button>

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
    btn.onclick = () => {
      jobs.splice(Number(btn.dataset.i), 1);
      localStorage.setItem(JOB_KEY, JSON.stringify(jobs));
      renderJobs();
    };
  });
}

document.getElementById("addJob").onclick = () => {
  const title = document.getElementById("jobTitle").value.trim();
  if (!title) return alert("Job title required.");

  jobs.push({
    title,
    customer: document.getElementById("jobCust").value.trim(),
    date: document.getElementById("jobDate").value,
    price: document.getElementById("jobPrice").value.trim(),
    status: document.getElementById("jobStatus").value,
    notes: document.getElementById("jobNotes").value.trim()
  });

  localStorage.setItem(JOB_KEY, JSON.stringify(jobs));
  renderJobs();

  ["jobTitle","jobCust","jobDate","jobPrice","jobStatus","jobNotes"]
    .forEach(id => document.getElementById(id).value = "");
};

// Initial render
renderCustomers();
renderJobs();
