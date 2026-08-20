// ============================================================
// REAL TREE GUY OS — CONTRACTS CENTER (FINAL VERSION + NOTIFICATIONS)
// ============================================================

import { rtgNotify } from "/assets/js/notify.js";

const API_BASE = "https://api.realtreeguy.com/api";

// ============================================================
// SAFE JSON WRAPPER
// ============================================================
async function safeJson(res, url) {
  const text = await res.text();
  if (!text || text.trim().startsWith("<")) {
    console.error("❌ API returned HTML instead of JSON:", url);
    rtgNotify("API Error", "Server returned HTML instead of JSON.", {
      type: "danger",
      scope: "user",
      data: { url }
    });
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ JSON parse failed:", url, err);
    rtgNotify("JSON Parse Error", "Failed to parse API response.", {
      type: "danger",
      scope: "user",
      data: { url }
    });
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
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      return await safeJson(res, url);
    } catch (err) {
      console.error("❌ GET failed:", url, err);
      rtgNotify("Network Error", "GET request failed.", {
        type: "danger",
        scope: "user",
        data: { url }
      });
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
      rtgNotify("Network Error", "POST request failed.", {
        type: "danger",
        scope: "user",
        data: { url }
      });
      return null;
    }
  }
};

// ============================================================
// STATE
// ============================================================
let userProfile = {};
let templates = [];
let templateData = {};
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
    rtgNotify("Profile Missing", "No user profile found.", {
      type: "warning",
      scope: "user"
    });
    return;
  }

  userProfile = data;

  const logoEl = document.getElementById("userLogo");
  const nameEl = document.getElementById("treeGuyName");

  if (logoEl) logoEl.src = userProfile.logo || "/assets/img/default-logo.png";
  if (nameEl) nameEl.value = userProfile.name || "";

  rtgNotify("Profile Loaded", "Your profile has been loaded.", {
    type: "success",
    scope: "user"
  });
}

// ============================================================
// LOAD TEMPLATE LIST
// ============================================================
async function loadTemplates() {
  const list = await API.get("/templates");
  if (!Array.isArray(list)) {
    rtgNotify("Template Error", "Failed to load templates.", {
      type: "danger",
      scope: "user"
    });
    return;
  }

  templates = list;

  const select = document.getElementById("templateSelect");
  if (!select) return;

  select.innerHTML =
    `<option value="">Choose template...</option>` +
    templates.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

  rtgNotify("Templates Loaded", "Contract templates updated.", {
    type: "info",
    scope: "user"
  });
}

// ============================================================
// TEMPLATE CHANGE
// ============================================================
async function onTemplateChange(e) {
  const id = e.target.value;
  if (!id) return;

  const tmpl = await API.get(`/templates/${id}`);
  if (!tmpl) {
    rtgNotify("Template Load Failed", "Could not load selected template.", {
      type: "danger",
      scope: "user",
      data: { id }
    });
    return;
  }

  templateData = tmpl;
  applyTemplateToUI(tmpl);

  rtgNotify("Template Applied", `Loaded template: ${tmpl.name}`, {
    type: "success",
    scope: "user",
    data: tmpl
  });
}

// ============================================================
// APPLY TEMPLATE TO UI
// ============================================================
function applyTemplateToUI(tmpl) {
  const scopeEl = document.getElementById("scope");
  const extraTermsEl = document.getElementById("extraTerms");

  if (scopeEl) {
    scopeEl.value =
      tmpl.scope ||
      tmpl.body ||
      tmpl.sections?.find(s => s.key === "scope")?.body ||
      "";
  }

  if (extraTermsEl) {
    extraTermsEl.value =
      tmpl.extra_terms ||
      tmpl.body ||
      tmpl.sections?.find(s => s.key === "payment_terms")?.body ||
      "";
  }
}

// ============================================================
// LOAD CLIENTS
// ============================================================
async function loadClients() {
  const data = await API.get("/clients");
  if (!data) return;

  clients = data;

  const select = document.getElementById("clientSelect");
  if (!select) return;

  select.innerHTML =
    `<option value="">Select client...</option>` +
    clients.map(c =>
      `<option value="${c.id}">${c.name} – ${c.phone || ""}</option>`
    ).join("");

  rtgNotify("Clients Loaded", "Client list updated.", {
    type: "info",
    scope: "user"
  });
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
    if (uploaded) {
      attachedPhotos.push(uploaded);
      rtgNotify("Photo Uploaded", `${file.name} uploaded successfully.`, {
        type: "success",
        scope: "user",
        data: uploaded
      });
    } else {
      rtgNotify("Photo Upload Failed", `${file.name} could not be uploaded.`, {
        type: "danger",
        scope: "user"
      });
    }
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
  if (!list) return;

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
    treeGuyName: document.getElementById("treeGuyName")?.value || "",
    clientName: document.getElementById("clientName")?.value || "",
    clientAddress: document.getElementById("clientAddress")?.value || "",
    clientPhone: document.getElementById("clientPhone")?.value || "",
    scope: document.getElementById("scope")?.value || "",
    totalPrice: document.getElementById("totalPrice")?.value || "",
    deposit: document.getElementById("deposit")?.value || "",
    paymentDueDate: document.getElementById("paymentDueDate")?.value || "",
    jobDate: document.getElementById("jobDate")?.value || "",
    extraTerms: document.getElementById("extraTerms")?.value || "",
    clientSignature: document.getElementById("clientSignature")?.value || "",
    treeGuySignature: document.getElementById("treeGuySignature")?.value || "",
    clientAgreed: document.getElementById("clientAgreed")?.checked || false
  };
}

// ============================================================
// PREVIEW DOCUMENT
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
    <p><strong>Tree Guy / Company:</strong> ${escapeHtml(fields.treeGuyName)}</p>
    <p><strong>Client:</strong> ${escapeHtml(fields.clientName)}</p>
    <p><strong>Address:</strong> ${escapeHtml(fields.clientAddress)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(fields.clientPhone)}</p>
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
    <p><strong>Client Signature:</strong> ${escapeHtml(fields.clientSignature)}</p>
    <p><strong>Tree Guy Signature:</strong> ${escapeHtml(fields.treeGuySignature)}</p>
    <p><strong>Client Agreed:</strong> ${fields.clientAgreed ? "Yes" : "No"}</p>
  `;

  const previewEl = document.getElementById("previewContent");
  if (previewEl) previewEl.innerHTML = html;
}

// ============================================================
// SAVE CONTRACT INSTANCE
// ============================================================
async function saveDoc(type) {
  const fields = collectFields();
  const clientId = document.getElementById("clientSelect")?.value || null;
  const templateId = document.getElementById("templateSelect")?.value || null;

  if (!fields.clientAgreed) {
    alert("Client must agree (e-sign checkbox) before saving.");
    return;
  }

  const saved = await API.post("/documents", {
    type,
    client_id: clientId,
    template_id: templateId,
    body: fields,
    photos: attachedPhotos,
    created_by: userProfile.id || null
  });

  if (!saved) {
    rtgNotify("Save Failed", "Contract could not be saved.", {
      type: "danger",
      scope: "user"
    });
    return;
  }

  rtgNotify("Contract Saved", `${type} saved successfully.`, {
    type: "success",
    scope: "user",
    data: saved
  });

  alert(type + " saved!");
}

// ============================================================
// EMAIL CONTRACT
// ============================================================
async function emailDoc(type) {
  const clientId = document.getElementById("clientSelect")?.value;
  const client = clients.find(c => String(c.id) === String(clientId));

  if (!client || !client.email) {
    alert("Client must have an email to send contract.");
    return;
  }

  const fields = collectFields();
  if (!fields.clientAgreed) {
    alert("Client must agree (e-sign checkbox) before emailing.");
    return;
  }

  previewDoc(type);
  const html = document.getElementById("previewContent")?.innerHTML || "";

  const sent = await API.post("/email", {
    to: client.email,
    subject: type + " from Real Tree Guy OS",
    body: html
  });

  if (!sent) {
    rtgNotify("Email Failed", "Contract email could not be sent.", {
      type: "danger",
      scope: "user"
    });
    return;
  }

  rtgNotify("Contract Emailed", `${type} emailed to ${client.email}`, {
    type: "success",
    scope: "user",
    data: sent
  });

  alert(type + " emailed to " + client.email + "!");
}

// ============================================================
// ESCAPE HTML
// ============================================================
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ============================================================
// CLIENT MODAL
// ============================================================
function openClientModal() {
  const modal = document.getElementById("clientModal");
  if (modal) modal.style.display = "flex";
}

function closeClientModal() {
  const modal = document.getElementById("clientModal");
  if (modal) modal.style.display = "none";
}

// ============================================================
// SAVE CLIENT
// ============================================================
async function saveClient() {
  const name = document.getElementById("modalClientName")?.value.trim() || "";
  const email = document.getElementById("modalClientEmail")?.value.trim() || "";
  const phone = document.getElementById("modalClientPhone")?.value.trim() || "";
  const address = document.getElementById("modalClientAddress")?.value.trim() || "";

  if (!name) {
    alert("Client name is required.");
    return;
  }

  const saved = await API.post("/clients", {
    name, email, phone, address
  });

  if (!saved) {
    rtgNotify("Client Save Failed", "Could not save new client.", {
      type: "danger",
      scope: "user"
    });
    return;
  }

  clients.push(saved);
  closeClientModal();
  await loadClients();

  const select = document.getElementById("clientSelect");
  if (select) {
    select.value = saved.id;
    onClientChange({ target: select });
  }

  rtgNotify("Client Added", `${saved.name} added to client list.`, {
    type: "success",
    scope: "user",
    data: saved
  });
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
    rtgNotify("Template Save Failed", "Could not save template.", {
      type: "danger",
      scope: "user"
    });
    return;
  }

  templates.push(saved);
  await loadTemplates();

  rtgNotify("Template Saved", `${name} saved successfully.`, {
    type: "success",
    scope: "user",
    data: saved
  });

  alert("Template saved!");
}

// ============================================================
// WIRE EVENTS
// ============================================================
function wireEvents() {
  const templateSelect = document.getElementById("templateSelect");
  const clientSelect = document.getElementById("clientSelect");
  const photoUpload = document.getElementById("photoUpload");
  const previewBtn = document.getElementById("previewBtn");
  const saveBtn = document.getElementById("saveBtn");
  const emailBtn = document.getElementById("emailBtn");
  const newClientBtn = document.getElementById("newClientBtn");
  const customTemplateBtn = document.getElementById("customTemplateBtn");
  const saveClientBtn = document.getElementById("saveClientBtn");
  const closeClientModalBtn = document.getElementById("closeClientModal");

  templateSelect?.addEventListener("change", onTemplateChange);
  clientSelect?.addEventListener("change", onClientChange);
  photoUpload?.addEventListener("change", onPhotoUpload);

  previewBtn?.addEventListener("click", () => previewDoc("Contract"));
  saveBtn?.addEventListener("click", () => saveDoc("Contract"));
  emailBtn?.addEventListener("click", () => emailDoc("Contract"));

  newClientBtn?.addEventListener("click", openClientModal);
  customTemplateBtn?.addEventListener("click", saveCurrentAsTemplate);

  saveClientBtn?.addEventListener("click", saveClient);
  closeClientModalBtn?.addEventListener("click", closeClientModal);
}
