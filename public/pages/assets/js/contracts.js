// REAL TREE GUY — CONTRACTS ENGINE (single file)

(function () {
  // DOM
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

  if (!previewBox) return;

  // Storage helpers
  const Storage = {
    get(key, fallback = []) {
      try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  function getFormData() {
    return {
      name: (nameEl?.value || "").trim(),
      phone: (phoneEl?.value || "").trim(),
      email: (emailEl?.value || "").trim(),
      address: (addrEl?.value || "").trim(),
      scope: (scopeEl?.value || "").trim(),
      price: (priceEl?.value || "").trim(),
      createdAt: new Date().toISOString()
    };
  }

  function buildContractText(data) {
    return [
      `TREE WORK AGREEMENT`,
      ``,
      `Client: ${data.name || "N/A"}`,
      `Phone: ${data.phone || "N/A"}`,
      `Email: ${data.email || "N/A"}`,
      `Address: ${data.address || "N/A"}`,
      ``,
      `Scope of Work:`,
      `${data.scope || "N/A"}`,
      ``,
      `Total Price: ${data.price || "N/A"}`,
      ``,
      `Client agrees to the above scope and price for tree work to be performed.`,
      ``,
      `Client Signature: _____________________________`,
      `Date: __________________`
    ].join("\n");
  }

  function renderPreview() {
    const data = getFormData();
    const text = buildContractText(data);
    previewBox.textContent = text;
  }

  function saveContract() {
    const data = getFormData();
    if (!data.name) {
      alert("Add at least a client name before saving.");
      return;
    }

    // Save customer
    const customers = Storage.get("rtgCustomers");
    const existing = customers.find(c => c.name === data.name && c.phone === data.phone);
    if (!existing) {
      customers.push({
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address
      });
      Storage.set("rtgCustomers", customers);
    }

    // Save contract
    const contracts = Storage.get("rtgContracts");
    contracts.push(data);
    Storage.set("rtgContracts", contracts);

    alert("Contract saved.");
  }

  function emailContract() {
    const data = getFormData();
    const body = encodeURIComponent(buildContractText(data));
    const subject = encodeURIComponent(`Tree Work Agreement for ${data.name || "Client"}`);
    const to = data.email || "";

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  function calendarContract() {
    const data = getFormData();
    const title = encodeURIComponent(`Tree Work – ${data.name || "Client"}`);
    const details = encodeURIComponent(buildContractText(data));
    const location = encodeURIComponent(data.address || "");

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(url, "_blank");
  }

  // Events
  previewBtn?.addEventListener("click", renderPreview);
  saveBtn?.addEventListener("click", saveContract);
  emailBtn?.addEventListener("click", emailContract);
  calBtn?.addEventListener("click", calendarContract);

  // Optional: auto-preview on input
  [nameEl, phoneEl, emailEl, addrEl, scopeEl, priceEl].forEach(el => {
    el?.addEventListener("change", renderPreview);
  });
})();
