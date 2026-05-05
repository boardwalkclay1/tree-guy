import { initDB, save } from "../../assets/js/db.js";
await initDB();

/* ELEMENTS */
const btn = document.getElementById("rtgClientBtn");
const panel = document.getElementById("rtgClientPanel");
const closeBtn = document.getElementById("qcClose");
const saveBtn = document.getElementById("qcSave");

const nameInput = document.getElementById("qcName");
const phoneInput = document.getElementById("qcPhone");
const emailInput = document.getElementById("qcEmail");
const addressInput = document.getElementById("qcAddress");
const notesInput = document.getElementById("qcNotes");

/* OPEN PANEL */
btn.onclick = () => {
  panel.style.display = "flex";
};

/* CLOSE PANEL */
closeBtn.onclick = () => {
  panel.style.display = "none";
};

/* SAVE CLIENT */
saveBtn.onclick = async () => {
  const client = {
    id: "CLIENT-" + Date.now(),
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    notes: notesInput.value.trim(),
    created: new Date().toISOString()
  };

  if (!client.name) {
    alert("Name is required.");
    return;
  }

  await save("clients", client);

  alert("Client saved!");

  nameInput.value = "";
  phoneInput.value = "";
  emailInput.value = "";
  addressInput.value = "";
  notesInput.value = "";

  panel.style.display = "none";
};

/* NAVIGATION BUTTONS */
document.getElementById("qcToClients").onclick = () =>
  window.location.href = "/pages/customers.html";

document.getElementById("qcToContracts").onclick = () =>
  window.location.href = "/pages/contracts.html";

document.getElementById("qcToEstimates").onclick = () =>
  window.location.href = "/pages/contracts/estimates.html";

document.getElementById("qcToProposals").onclick = () =>
  window.location.href = "/pages/contracts/proposals.html";

document.getElementById("qcToInvoices").onclick = () =>
  window.location.href = "/pages/contracts/invoices.html";
