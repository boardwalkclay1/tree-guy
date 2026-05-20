// ============================================================
// REAL TREE GUY OS — CONTRACTS CENTER (D1 VERSION)
// ============================================================

const API = {
  async get(path) {
    const r = await fetch(path);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return r.json();
  },
  async delete(path) {
    const r = await fetch(path, { method: "DELETE" });
    return r.json();
  }
};

// DOM
const tabButtons = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".tab-section");
const previewBox = document.getElementById("previewContent");
const userLogo = document.getElementById("userLogo");

// TAB SWITCHING
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    tabSections.forEach(sec => {
      sec.classList.toggle("active", sec.id === tab);
    });

    previewBox.innerHTML = "Fill fields and tap Preview.";
  });
});

// UNIVERSAL PREVIEW BUILDER
function buildPreview(title, fields) {
  return `
    <div class="preview-doc">
      <img src="${userLogo.src}" class="preview-logo">

      <h2>${title}</h2>

      <p><strong>Client:</strong> ${fields.name}</p>
      <p><strong>Phone:</strong> ${fields.phone}</p>
      <p><strong>Email:</strong> ${fields.email}</p>
      <p><strong>Address:</strong> ${fields.address}</p>

      <hr>

      ${fields.scope ? `<p><strong>Scope:</strong> ${fields.scope}</p>` : ""}
      ${fields.work ? `<p><strong>Work:</strong> ${fields.work}</p>` : ""}
      ${fields.deliverables ? `<p><strong>Deliverables:</strong> ${fields.deliverables}</p>` : ""}

      ${fields.price ? `<p><strong>Price:</strong> $${fields.price}</p>` : ""}
      ${fields.labor ? `<p><strong>Labor:</strong> $${fields.labor}</p>` : ""}
      ${fields.materials ? `<p><strong>Materials:</strong> $${fields.materials}</p>` : ""}
      ${fields.amount ? `<p><strong>Amount Due:</strong> $${fields.amount}</p>` : ""}
    </div>
  `;
}

// CONTRACT PREVIEW
document.getElementById("cPreviewBtn").addEventListener("click", () => {
  previewBox.innerHTML = buildPreview("Service Contract", {
    name: cName.value,
    phone: cPhone.value,
    email: cEmail.value,
    address: cAddress.value,
    scope: cScope.value,
    price: cPrice.value
  });
});

// ESTIMATE PREVIEW
document.getElementById("ePreviewBtn").addEventListener("click", () => {
  previewBox.innerHTML = buildPreview("Estimate", {
    name: eName.value,
    phone: ePhone.value,
    email: eEmail.value,
    address: eAddress.value,
    scope: eScope.value,
    labor: eLabor.value,
    materials: eMaterials.value
  });
});

// PROPOSAL PREVIEW
document.getElementById("pPreviewBtn").addEventListener("click", () => {
  previewBox.innerHTML = buildPreview("Proposal", {
    name: pName.value,
    phone: pPhone.value,
    email: pEmail.value,
    address: pAddress.value,
    scope: pScope.value,
    deliverables: pDeliverables.value,
    price: pPrice.value
  });
});

// INVOICE PREVIEW
document.getElementById("iPreviewBtn").addEventListener("click", () => {
  previewBox.innerHTML = buildPreview("Invoice", {
    name: iName.value,
    phone: iPhone.value,
    email: iEmail.value,
    address: iAddress.value,
    amount: iAmount.value
  });
});
