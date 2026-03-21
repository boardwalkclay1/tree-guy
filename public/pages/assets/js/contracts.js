// contracts.js — Real Tree Guy OS (IndexedDB Version)

import { initDB, save, getAll, remove } from "../../../assets/js/db.js";

await initDB();

/* ============================================================
   DOM ELEMENTS
   ============================================================ */
const clientName = document.getElementById("clientName");
const clientPhone = document.getElementById("clientPhone");
const clientEmail = document.getElementById("clientEmail");
const clientAddress = document.getElementById("clientAddress");
const scope = document.getElementById("scope");
const price = document.getElementById("price");

const fill = document.getElementById("fill");
const send = document.getElementById("send");
const saveBtn = document.getElementById("save");
const calendarBtn = document.getElementById("calendar");

const previewBox = document.getElementById("previewBox");

/* ============================================================
   BUILD CONTRACT OBJECT
   ============================================================ */
function buildContract() {
  const id = "CT-" + Date.now();

  return {
    id,
    name: clientName.value.trim(),
    phone: clientPhone.value.trim(),
    email: clientEmail.value.trim(),
    address: clientAddress.value.trim(),
    scope: scope.value.trim(),
    price: price.value.trim(),
    timestamp: new Date().toLocaleString()
  };
}

/* ============================================================
   RENDER PREVIEW
   ============================================================ */
function renderPreview(data) {
  previewBox.textContent = `
TREE WORK AGREEMENT
Contract ID: ${data.id}
Generated: ${data.timestamp}

Client:
  Name: ${data.name}
  Phone: ${data.phone}
  Email: ${data.email}
  Address: ${data.address}

-----------------------------------------
SCOPE OF WORK
-----------------------------------------
${data.scope}

-----------------------------------------
PRICE
-----------------------------------------
${data.price}

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
  `;
}

/* ============================================================
   PREVIEW BUTTON
   ============================================================ */
fill.onclick = () => {
  const data = buildContract();
  renderPreview(data);
};

/* ============================================================
   SAVE CONTRACT (IndexedDB)
   ============================================================ */
saveBtn.onclick = async () => {
  const data = buildContract();

  await save("contracts", data);

  alert("Contract saved.");
};

/* ============================================================
   SEND VIA EMAIL
   ============================================================ */
send.onclick = () => {
  const data = buildContract();
  renderPreview(data);

  const body = encodeURIComponent(previewBox.textContent);

  window.location.href =
    `mailto:${data.email}?subject=Tree Work Agreement ${data.id}&body=${body}`;
};

/* ============================================================
   ADD TO CALENDAR (IndexedDB)
   ============================================================ */
calendarBtn.onclick = async () => {
  const data = buildContract();

  const event = {
    id: "EV-" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    title: `Contract: ${data.id}`,
    notes: data.scope,
    type: "contract"
  };

  await save("calendar", event);

  alert("Added to calendar.");
};
