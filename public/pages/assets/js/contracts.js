// Keys
const CONTRACT_KEY = "rtg_contracts_v1";

// Load saved contracts
let contracts = JSON.parse(localStorage.getItem(CONTRACT_KEY) || "[]");

// Build contract object
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

// Render preview
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

// Preview button
fill.onclick = () => {
  const data = buildContract();
  renderPreview(data);
};

// Save contract
save.onclick = () => {
  const data = buildContract();
  contracts.push(data);
  localStorage.setItem(CONTRACT_KEY, JSON.stringify(contracts));
  alert("Contract saved.");
};

// Email contract
send.onclick = () => {
  const data = buildContract();
  const body = encodeURIComponent(previewBox.textContent);
  window.location.href = `mailto:${data.email}?subject=Tree Work Agreement ${data.id}&body=${body}`;
};

// Add to calendar (local event list)
calendar.onclick = () => {
  const events = JSON.parse(localStorage.getItem("rtg_events_v1") || "[]");

  const data = buildContract();

  events.push({
    id: Date.now(),
    date: new Date().toISOString().split("T")[0],
    title: `Contract: ${data.id}`,
    notes: data.scope
  });

  localStorage.setItem("rtg_events_v1", JSON.stringify(events));
  alert("Added to calendar.");
};
