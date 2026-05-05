// ============================================================
// REAL TREE GUY — CONTRACTS ENGINE (FULL SUITE)
// Contracts • Estimates • Proposals • Invoices
// ============================================================

import { initDB, save, getAll } from "./db.js";
await initDB();

/* ============================================================
   TAB SWITCHING
============================================================ */
const tabButtons = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".tab-section");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;

    tabButtons.forEach(b => b.classList.remove("active"));
    tabSections.forEach(s => s.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});

/* ============================================================
   HELPERS
============================================================ */
async function ensureClient(data) {
  if (!data.name) return;

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
}

function openMail(to, subject, body) {
  window.location.href =
    `mailto:${encodeURIComponent(to || "")}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;
}

function openCalendar(title, details, location) {
  const url =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location || "")}`;
  window.open(url, "_blank");
}

/* ============================================================
   CONTRACTS
============================================================ */
const cName = document.getElementById("cName");
const cPhone = document.getElementById("cPhone");
const cEmail = document.getElementById("cEmail");
const cAddress = document.getElementById("cAddress");
const cScope = document.getElementById("cScope");
const cPrice = document.getElementById("cPrice");

const cPreviewBtn = document.getElementById("cPreviewBtn");
const cSaveBtn = document.getElementById("cSaveBtn");
const cEmailBtn = document.getElementById("cEmailBtn");
const cCalBtn = document.getElementById("cCalBtn");
const cPreviewBox = document.getElementById("cPreviewBox");

function getContractData() {
  return {
    id: "CON-" + Date.now(),
    type: "contract",
    name: (cName?.value || "").trim(),
    phone: (cPhone?.value || "").trim(),
    email: (cEmail?.value || "").trim(),
    address: (cAddress?.value || "").trim(),
    scope: (cScope?.value || "").trim(),
    price: (cPrice?.value || "").trim(),
    createdAt: new Date().toISOString()
  };
}

function buildContractText(d) {
  return `
TREE WORK AGREEMENT

Client: ${d.name || "N/A"}
Phone: ${d.phone || "N/A"}
Email: ${d.email || "N/A"}
Address: ${d.address || "N/A"}

-----------------------------------------
SCOPE OF WORK
-----------------------------------------
${d.scope || "N/A"}

-----------------------------------------
PRICE
-----------------------------------------
${d.price || "N/A"}

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

function renderContractPreview() {
  const d = getContractData();
  if (cPreviewBox) cPreviewBox.textContent = buildContractText(d);
}

async function saveContract() {
  const d = getContractData();
  if (!d.name) {
    alert("Client name is required.");
    return;
  }
  await ensureClient(d);
  await save("contracts", d);
  alert("Contract saved.");
}

function emailContract() {
  const d = getContractData();
  openMail(
    d.email,
    `Tree Work Agreement for ${d.name || "Client"}`,
    buildContractText(d)
  );
}

function calendarContract() {
  const d = getContractData();
  openCalendar(
    `Tree Work – ${d.name || "Client"}`,
    buildContractText(d),
    d.address
  );
}

[cName, cPhone, cEmail, cAddress, cScope, cPrice].forEach(el =>
  el?.addEventListener("input", renderContractPreview)
);
cPreviewBtn?.addEventListener("click", renderContractPreview);
cSaveBtn?.addEventListener("click", saveContract);
cEmailBtn?.addEventListener("click", emailContract);
cCalBtn?.addEventListener("click", calendarContract);

/* ============================================================
   ESTIMATES
============================================================ */
const eName = document.getElementById("eName");
const ePhone = document.getElementById("ePhone");
const eEmail = document.getElementById("eEmail");
const eAddress = document.getElementById("eAddress");
const eScope = document.getElementById("eScope");
const eLabor = document.getElementById("eLabor");
const eMaterials = document.getElementById("eMaterials");

const ePreviewBtn = document.getElementById("ePreviewBtn");
const eSaveBtn = document.getElementById("eSaveBtn");
const eEmailBtn = document.getElementById("eEmailBtn");
const eCalBtn = document.getElementById("eCalBtn");
const ePreviewBox = document.getElementById("ePreviewBox");

function getEstimateData() {
  const labor = parseFloat((eLabor?.value || "0").replace(/[^0-9.]/g, "")) || 0;
  const materials =
    parseFloat((eMaterials?.value || "0").replace(/[^0-9.]/g, "")) || 0;

  return {
    id: "EST-" + Date.now(),
    type: "estimate",
    name: (eName?.value || "").trim(),
    phone: (ePhone?.value || "").trim(),
    email: (eEmail?.value || "").trim(),
    address: (eAddress?.value || "").trim(),
    scope: (eScope?.value || "").trim(),
    labor,
    materials,
    total: labor + materials,
    createdAt: new Date().toISOString()
  };
}

function buildEstimateText(d) {
  return `
TREE WORK ESTIMATE

Client: ${d.name || "N/A"}
Phone: ${d.phone || "N/A"}
Email: ${d.email || "N/A"}
Address: ${d.address || "N/A"}

-----------------------------------------
WORK DESCRIPTION
-----------------------------------------
${d.scope || "N/A"}

-----------------------------------------
COST BREAKDOWN
-----------------------------------------
Labor: $${d.labor.toFixed(2)}
Materials: $${d.materials.toFixed(2)}
-----------------------------------------
ESTIMATED TOTAL: $${d.total.toFixed(2)}

-----------------------------------------
NOTES
-----------------------------------------
• This is an estimate only; final price may vary based on site conditions.
• Estimate valid for 30 days unless otherwise stated.
`.trim();
}

function renderEstimatePreview() {
  const d = getEstimateData();
  if (ePreviewBox) ePreviewBox.textContent = buildEstimateText(d);
}

async function saveEstimate() {
  const d = getEstimateData();
  if (!d.name) {
    alert("Client name is required.");
    return;
  }
  await ensureClient(d);
  await save("estimates", d);
  alert("Estimate saved.");
}

function emailEstimate() {
  const d = getEstimateData();
  openMail(
    d.email,
    `Tree Work Estimate for ${d.name || "Client"}`,
    buildEstimateText(d)
  );
}

function calendarEstimate() {
  const d = getEstimateData();
  openCalendar(
    `Tree Estimate – ${d.name || "Client"}`,
    buildEstimateText(d),
    d.address
  );
}

[eName, ePhone, eEmail, eAddress, eScope, eLabor, eMaterials].forEach(el =>
  el?.addEventListener("input", renderEstimatePreview)
);
ePreviewBtn?.addEventListener("click", renderEstimatePreview);
eSaveBtn?.addEventListener("click", saveEstimate);
eEmailBtn?.addEventListener("click", emailEstimate);
eCalBtn?.addEventListener("click", calendarEstimate);

/* ============================================================
   PROPOSALS
============================================================ */
const pName = document.getElementById("pName");
const pPhone = document.getElementById("pPhone");
const pEmail = document.getElementById("pEmail");
const pAddress = document.getElementById("pAddress");
const pScope = document.getElementById("pScope");
const pDeliverables = document.getElementById("pDeliverables");
const pPrice = document.getElementById("pPrice");

const pPreviewBtn = document.getElementById("pPreviewBtn");
const pSaveBtn = document.getElementById("pSaveBtn");
const pEmailBtn = document.getElementById("pEmailBtn");
const pCalBtn = document.getElementById("pCalBtn");
const pPreviewBox = document.getElementById("pPreviewBox");

function getProposalData() {
  return {
    id: "PRO-" + Date.now(),
    type: "proposal",
    name: (pName?.value || "").trim(),
    phone: (pPhone?.value || "").trim(),
    email: (pEmail?.value || "").trim(),
    address: (pAddress?.value || "").trim(),
    scope: (pScope?.value || "").trim(),
    deliverables: (pDeliverables?.value || "").trim(),
    price: (pPrice?.value || "").trim(),
    createdAt: new Date().toISOString()
  };
}

function buildProposalText(d) {
  return `
TREE WORK PROPOSAL

Client: ${d.name || "N/A"}
Phone: ${d.phone || "N/A"}
Email: ${d.email || "N/A"}
Address: ${d.address || "N/A"}

-----------------------------------------
PROJECT OVERVIEW
-----------------------------------------
${d.scope || "N/A"}

-----------------------------------------
DELIVERABLES
-----------------------------------------
${d.deliverables || "N/A"}

-----------------------------------------
INVESTMENT
-----------------------------------------
${d.price || "N/A"}

-----------------------------------------
NOTES
-----------------------------------------
• Work will be performed safely and professionally.
• Schedule will be confirmed upon acceptance.
• Client may accept this proposal by replying "APPROVED" to this email.

-----------------------------------------
SIGNATURES
-----------------------------------------
Client Signature: _______________________
Business Representative: _______________________
`.trim();
}

function renderProposalPreview() {
  const d = getProposalData();
  if (pPreviewBox) pPreviewBox.textContent = buildProposalText(d);
}

async function saveProposal() {
  const d = getProposalData();
  if (!d.name) {
    alert("Client name is required.");
    return;
  }
  await ensureClient(d);
  await save("proposals", d);
  alert("Proposal saved.");
}

function emailProposal() {
  const d = getProposalData();
  openMail(
    d.email,
    `Tree Work Proposal for ${d.name || "Client"}`,
    buildProposalText(d)
  );
}

function calendarProposal() {
  const d = getProposalData();
  openCalendar(
    `Tree Proposal – ${d.name || "Client"}`,
    buildProposalText(d),
    d.address
  );
}

[
  pName,
  pPhone,
  pEmail,
  pAddress,
  pScope,
  pDeliverables,
  pPrice
].forEach(el => el?.addEventListener("input", renderProposalPreview));
pPreviewBtn?.addEventListener("click", renderProposalPreview);
pSaveBtn?.addEventListener("click", saveProposal);
pEmailBtn?.addEventListener("click", emailProposal);
pCalBtn?.addEventListener("click", calendarProposal);

/* ============================================================
   INVOICES
============================================================ */
const iName = document.getElementById("iName");
const iPhone = document.getElementById("iPhone");
const iEmail = document.getElementById("iEmail");
const iAddress = document.getElementById("iAddress");
const iWork = document.getElementById("iWork");
const iAmount = document.getElementById("iAmount");

const iPreviewBtn = document.getElementById("iPreviewBtn");
const iSaveBtn = document.getElementById("iSaveBtn");
const iEmailBtn = document.getElementById("iEmailBtn");
const iPreviewBox = document.getElementById("iPreviewBox");

function getInvoiceData() {
  return {
    id: "INV-" + Date.now(),
    type: "invoice",
    name: (iName?.value || "").trim(),
    phone: (iPhone?.value || "").trim(),
    email: (iEmail?.value || "").trim(),
    address: (iAddress?.value || "").trim(),
    work: (iWork?.value || "").trim(),
    amount: (iAmount?.value || "").trim(),
    createdAt: new Date().toISOString()
  };
}

function buildInvoiceText(d) {
  return `
TREE WORK INVOICE

Client: ${d.name || "N/A"}
Phone: ${d.phone || "N/A"}
Email: ${d.email || "N/A"}
Address: ${d.address || "N/A"}

-----------------------------------------
WORK PERFORMED
-----------------------------------------
${d.work || "N/A"}

-----------------------------------------
AMOUNT DUE
-----------------------------------------
${d.amount || "N/A"}

-----------------------------------------
PAYMENT TERMS
-----------------------------------------
• Payment is due upon receipt unless otherwise agreed.
• Accepted payment methods: cash, check, or agreed electronic methods.
• Please include the client name in the payment memo.

Thank you for choosing Real Tree Guy for your tree work.
`.trim();
}

function renderInvoicePreview() {
  const d = getInvoiceData();
  if (iPreviewBox) iPreviewBox.textContent = buildInvoiceText(d);
}

async function saveInvoice() {
  const d = getInvoiceData();
  if (!d.name) {
    alert("Client name is required.");
    return;
  }
  await ensureClient(d);
  await save("invoices", d);
  alert("Invoice saved.");
}

function emailInvoice() {
  const d = getInvoiceData();
  openMail(
    d.email,
    `Invoice for Tree Work – ${d.name || "Client"}`,
    buildInvoiceText(d)
  );
}

[iName, iPhone, iEmail, iAddress, iWork, iAmount].forEach(el =>
  el?.addEventListener("input", renderInvoicePreview)
);
iPreviewBtn?.addEventListener("click", renderInvoicePreview);
iSaveBtn?.addEventListener("click", saveInvoice);
iEmailBtn?.addEventListener("click", emailInvoice);

/* ============================================================
   INITIAL PREVIEWS
============================================================ */
renderContractPreview();
renderEstimatePreview();
renderProposalPreview();
renderInvoicePreview();
