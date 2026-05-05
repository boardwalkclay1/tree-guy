// ============================================================
// REAL TREE GUY — CONTRACTS ENGINE (FULL REBUILD)
// Supports: Contracts, Estimates, Proposals, Invoices
// ============================================================

import { initDB, save, getAll } from "./db.js";
await initDB();

/* ============================================================
   DOM ELEMENTS
============================================================ */
const nameEl = document.getElementById("cName");
const phoneEl = document.getElementById("cPhone");
const emailEl = document.getElementById("cEmail");
const addrEl = document.getElementById("cAddress");
const scopeEl = document.getElementById("cScope");
const priceEl = document.getElementById("cPrice");

const previewBtn = document.getElementById("cPreviewBtn");
const saveBtn = document.getElementById("cSaveBtn");
const emailBtn = document.getElementById("cEmailBtn");
const calBtn = document.getElementById("cCalBtn");
const previewBox = document.getElementById("cPreviewBox");

if (!previewBox) {
  console.warn("Contracts engine loaded on a page without contract elements.");
}

/* ============================================================
   BUILD DATA OBJECT
============================================================ */
function getFormData() {
  return {
    id: "CON-" + Date.now(),
    type: "contract", // future: estimate, proposal, invoice
    name: (nameEl?.value || "").trim(),
    phone: (phoneEl?.value || "").trim(),
    email: (emailEl?.value || "").trim(),
    address: (addrEl?.value || "").trim(),
    scope: (scopeEl?.value || "").trim(),
    price: (priceEl?.value || "").trim(),
    createdAt: new Date().toISOString()
  };
}

/* ============================================================
   CONTRACT TEMPLATE
============================================================ */
function buildContractText(data) {
  return `
TREE WORK AGREEMENT

Client: ${data.name || "N/A"}
Phone: ${data.phone || "N/A"}
Email: ${data.email || "N/A"}
Address: ${data.address || "N/A"}

-----------------------------------------
SCOPE OF WORK
-----------------------------------------
${data.scope || "N/A"}

-----------------------------------------
PRICE
-----------------------------------------
${data.price || "N/A"}

-----------------------------------------
TERMS
-----------------------------------------
• Client agrees to allow access to property.
• Work will be completed professionally and safely.
• Payment is due upon completion unless otherwise stated.
• Client may reply to this email with their typed name as an e-signature.

-----------------------------------------
SIGNATURES
-----------------------------------------
Client Signature: _______________________
Business Representative: _______________________
  `.trim();
}

/* ============================================================
   PREVIEW
============================================================ */
function renderPreview() {
  const data = getFormData();
  previewBox.textContent = buildContractText(data);
}

/* ============================================================
   SAVE CONTRACT + CLIENT
============================================================ */
async function saveContract() {
  const data = getFormData();

  if (!data.name) {
    alert("Client name is required.");
    return;
  }

  // Save client
  const clients = await getAll("clients");
  const exists = clients.find(
    c => c.name === data.name && c.phone === data.phone
  );

  if (!exists) {
    await save("clients", {
      id: "CLIENT-" + Date.now(),
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: "",
      createdAt: new Date().toISOString()
    });
  }

  // Save contract
  await save("contracts", data);

  alert("Contract saved.");
}

/* ============================================================
   EMAIL CONTRACT
============================================================ */
function emailContract() {
  const data = getFormData();
  const body = encodeURIComponent(buildContractText(data));
  const subject = encodeURIComponent(`Tree Work Agreement for ${data.name || "Client"}`);
  const to = data.email || "";

  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

/* ============================================================
   ADD TO CALENDAR
============================================================ */
function calendarContract() {
  const data = getFormData();

  const title = encodeURIComponent(`Tree Work – ${data.name || "Client"}`);
  const details = encodeURIComponent(buildContractText(data));
  const location = encodeURIComponent(data.address || "");

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  window.open(url, "_blank");
}

/* ============================================================
   EVENT LISTENERS
============================================================ */
previewBtn?.addEventListener("click", renderPreview);
saveBtn?.addEventListener("click", saveContract);
emailBtn?.addEventListener("click", emailContract);
calBtn?.addEventListener("click", calendarContract);

// Auto-preview on input
[nameEl, phoneEl, emailEl, addrEl, scopeEl, priceEl].forEach(el => {
  el?.addEventListener("input", renderPreview);
});

// Initial preview
renderPreview();
