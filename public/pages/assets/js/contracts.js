// ============================================================
// REAL TREE GUY OS — CONTRACTS CENTER (FINAL FIXED VERSION)
// ============================================================

// ALWAYS hit your Worker domain directly
const API_BASE = "https://api.realtreeguy.com/api";

// ============================================================
// SAFE JSON WRAPPER — NEVER CRASHES
// ============================================================
async function safeJson(res, url) {
  const text = await res.text();

  // If Worker returned HTML, do NOT crash
  if (!text || text.trim().startsWith("<")) {
    console.error("❌ API returned HTML instead of JSON:", url);
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ JSON parse failed at:", url, err);
    return null;
  }
}

// ============================================================
// API WRAPPER
// ============================================================
const API = {
  async get(path) {
    const url = `${API_BASE}${path}`;
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      return await safeJson(res, url);
    } catch (err) {
      console.error("❌ GET failed:", url, err);
      return null;
    }
  },

  async post(path, body) {
    const url = `${API_BASE}${path}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(body)
      });
      return await safeJson(res, url);
    } catch (err) {
      console.error("❌ POST failed:", url, err);
      return null;
    }
  }
};

// ============================================================
// STATE
// ============================================================
let userProfile = {};
let templates = [];
let clients = [];
let attachedPhotos = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  loadTemplates();
  loadClients();
  wireEvents();
});

// ============================================================
// LOAD USER PROFILE
// ============================================================
async function loadProfile() {
  const data = await API.get("/profile");
  if (!data) {
    console.warn("⚠ Profile load failed — using fallback");
    return;
  }

  userProfile = data;

  document.getElementById("userLogo").src =
    userProfile.logo || "/assets/img/default-logo.png";

  document.getElementById("treeGuyName").value =
    userProfile.name || "";
}

// ============================================================
// LOAD TEMPLATES
// ============================================================
async function loadTemplates() {
  const data = await API.get("/templates");
  if (!data) {
    console.warn("⚠ Templates load failed — using empty list");
    return;
  }

  templates = data;

  const select = document.getElementById("templateSelect");
  select.innerHTML = `<option value="">Choose template...</option>` +
    templates.map(t =>
      `<option value="${t.id}">${t.type} – ${t.name}</option>`
    ).join("");
}

// ============================================================
// LOAD CLIENTS
// ============================================================
async function loadClients() {
  const data = await API.get("/clients");
  if (!data) {
    console.warn("⚠ Clients load failed — using empty list");
    return;
  }

  clients = data;

  const select = document.getElementById("clientSelect");
  select.innerHTML = `<option value="">Select client...</option>` +
    clients.map(c =>
      `<option value="${c.id}">${c.name} – ${c.phone || ""}</option>`
    ).join("");
}

// ============================================================
// EVENTS
// ============================================================
function wireEvents() {
  document.getElementById("templateSelect")
    .addEventListener("change", onTemplateChange);

  document.getElementById("clientSelect")
    .addEventListener("change", onClientChange);

  document.getElementById("previewBtn")
    .addEventListener("click", () => previewDoc("Contract"));

  document.getElementById("saveBtn")
    .addEventListener("click", () => saveDoc("Contract"));

  document.getElementById("emailBtn")
    .addEventListener("click", () => emailDoc("Contract"));

  document.getElementById("photoUpload")
    .addEventListener("change", onPhotoUpload);

  document.getElementById("newClientBtn")
    .addEventListener("click", openClientModal);

  document.getElementById("closeClientModal")
    .addEventListener("click", closeClientModal);

  document.getElementById("saveClientBtn")
    .addEventListener("click", saveClient);

  document.getElementById("customTemplateBtn")
    .addEventListener("click", saveCurrentAsTemplate);
}

// ============================================================
// TEMPLATE CHANGE
// ============================================================
function onTemplateChange(e) {
  const id = e.target.value;
  if (!id) return;

  const t = templates.find(t => String(t.id) === String(id));
  if (!t) return;

  document.getElementById("scope").value = t.scope || "";
  document.getElementById("extraTerms").value = t.body || "";
}

// ============================================================
// CLIENT CHANGE
// ============================================================
function onClientChange(e) {
  const id = e.target.value;
  if (!id) return;

  const c = clients.find(c => String(c.id) === String(id));
  if (!c) return;

  document.getElementById("clientName").value = c.name || "";
  document.getElementById("clientAddress").value = c.address || "";
  document.getElementById("clientPhone").value = c.phone || "";
}

// ============================================================
// PHOTO UPLOAD
// ============================================================
async function onPhotoUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  for (const file of files) {
    const uploaded = await uploadPhoto(file);
    if (uploaded) attachedPhotos.push(uploaded);
  }

  renderPhotoList();
}

async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_BASE}/upload-photo`;

  try {
    const res = await fetch(url, { method: "POST", body: formData });
    return await safeJson(res, url);
  } catch (err) {
    console.error("❌ Photo upload failed:", err);
    return null;
  }
}

function renderPhotoList() {
  const list = document.getElementById("photoList");

  if (!attachedPhotos.length) {
    list.textContent = "No photos attached.";
    return;
  }

  list.innerHTML = attachedPhotos.map(p =>
    `<span>📷 ${p.name || "Photo"} (${p.id})</span>`
  ).join(" ");
}

// ============================================================
// COLLECT FIELDS
// ============================================================
function collectFields() {
  return {
    treeGuyName: document.getElementById("treeGuyName").value,
    clientName: document.getElementById("clientName").value,
    clientAddress: document.getElementById("clientAddress").value,
    clientPhone: document.getElementById("clientPhone").value,
    scope: document.getElementById("scope").value,
    totalPrice: document.getElementById("totalPrice").value,
    deposit: document.getElementById("deposit").value,
    paymentDueDate: document.getElementById("paymentDueDate").value,
    jobDate: document.getElementById("jobDate").value,
    extraTerms: document.getElementById("extraTerms").value,
    clientSignature: document.getElementById("clientSignature").value,
    treeGuySignature: document.getElementById("treeGuySignature").value,
    clientAgreed: document.getElementById("clientAgreed").checked
  };
}

// ============================================================
// PREVIEW
// ============================================================
function previewDoc(type) {
  const fields = collectFields();

  const photosHtml = attachedPhotos.length
    ? `<h3>Attached Photos</h3>
       <ul>${attachedPhotos.map(p =>
         `<li><a href="${p.url}" target="_blank">${p.name || p.id}</a></li>`
       ).join("")}</ul>`
    : "";

  const html = `
    <h2>${type}</h2>
    <p><strong>Tree Guy / Company:</strong> ${fields.treeGuyName}</p>
    <p><strong>Client:</strong> ${fields.clientName}</p>
    <p><strong>Address:</strong> ${fields.clientAddress}</p>
    <p><strong>Phone:</strong> ${fields.clientPhone}</p>
    <hr>
    <h3>Scope of Work</h3>
    <p>${escapeHtml(fields.scope).replace(/\n/g, "<br>")}</p>
    <h3>Payment</h3>
    <p><strong>Total Price:</strong> $${fields.totalPrice || "0.00"}</p>
    <p><strong>Deposit:</strong> $${fields.deposit || "0.00"}</p>
    <p><strong>Payment Due Date:</strong> ${fields.paymentDueDate || "N/A"}</p>
    <p><strong>Job Date:</strong> ${fields.jobDate || "N/A"}</p>
    <h3>Extra Terms</h3>
    <p>${escapeHtml(fields.extraTerms).replace(/\n/g, "<br>")}</p>
    ${photosHtml}
    <hr>
    <h3>Signatures</h3>
    <p><strong>Client Signature:</strong> ${fields.clientSignature}</p>
    <p><strong>Tree Guy Signature:</strong> ${fields.treeGuySignature}</p>
    <p><strong>Client Agreed:</strong> ${fields.clientAgreed ? "Yes" : "No"}</p>
  `;

  document.getElementById("previewContent").innerHTML = html;
}

// ============================================================
// SAVE CONTRACT
// ============================================================
async function saveDoc(type) {
  const fields = collectFields();
  const clientId = document.getElementById("clientSelect").value || null;
  const templateId = document.getElementById("templateSelect").value || null;

  await API.post("/documents", {
    type,
    client_id: clientId,
    template_id: templateId,
    body: fields,
    photos: attachedPhotos,
    created_by: userProfile.id || null
  });

  alert(type + " saved!");
}

// ============================================================
// EMAIL CONTRACT
// ============================================================
async function emailDoc(type) {
  const clientId = document.getElementById("clientSelect").value;
  const client = clients.find(c => String(c.id) === String(clientId));

  if (!client || !client.email) {
    alert("Client must have an email to send contract.");
    return;
  }

  previewDoc(type);
  const html = document.getElementById("previewContent").innerHTML;

  await API.post("/email", {
    to: client.email,
    subject: type + " from Real Tree Guy OS",
    body: html
  });

  alert(type + " emailed to " + client.email + "!");
}

// ============================================================
// ESCAPE HTML
// ============================================================
function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ============================================================
// CLIENT MODAL
// ============================================================
function openClientModal() {
  document.getElementById("clientModal").style.display = "flex";
}

function closeClientModal() {
  document.getElementById("clientModal").style.display = "none";
}

// ============================================================
// SAVE CLIENT
// ============================================================
async function saveClient() {
  const name = document.getElementById("modalClientName").value.trim();
  const email = document.getElementById("modalClientEmail").value.trim();
  const phone = document.getElementById("modalClientPhone").value.trim();
  const address = document.getElementById("modalClientAddress").value.trim();

  if (!name) {
    alert("Client name is required.");
    return;
  }

  const saved = await API.post("/clients", {
    name, email, phone, address
  });

  if (!saved) {
    alert("Client save failed.");
    return;
  }

  clients.push(saved);
  closeClientModal();
  await loadClients();

  const select = document.getElementById("clientSelect");
  select.value = saved.id;
  onClientChange({ target: select });
}

// ============================================================
// SAVE CURRENT AS TEMPLATE
// ============================================================
async function saveCurrentAsTemplate() {
  const fields = collectFields();
  const name = prompt("Template name:");
  if (!name) return;

  const payload = {
    name,
    type: "Tree Work Contract",
    scope: fields.scope,
    body: fields.extraTerms
  };

  const saved = await API.post("/templates", payload);
  if (!saved) {
    alert("Template save failed.");
    return;
  }

  templates.push(saved);
  await loadTemplates();
  alert("Template saved!");
}
