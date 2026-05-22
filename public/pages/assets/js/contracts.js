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
  }
};

// LOAD USER PROFILE
let userProfile = {};
async function loadProfile() {
  userProfile = await API.get("/api/profile");
  document.getElementById("userLogo").src = userProfile.logo || "/assets/img/default-logo.png";
}
loadProfile();

// LOAD PRESET + USER TEMPLATES
let templates = {};
async function loadTemplates() {
  const rows = await API.get("/api/templates");
  templates = rows.reduce((acc, t) => {
    acc[t.type] = t.body;
    return acc;
  }, {});
}
loadTemplates();

// TAB SWITCHING
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".tab-btn.active").classList.remove("active");
    btn.classList.add("active");

    const type = btn.dataset.doc;
    loadForm(type);
  });
});

// LOAD FORM
function loadForm(type) {
  const form = document.getElementById("docForm");
  form.innerHTML = templates[type] || "<p>No template found.</p>";
}

// PREVIEW
function previewDoc(type) {
  const fields = {};
  document.querySelectorAll("#docForm input, #docForm textarea").forEach(f => {
    fields[f.id] = f.value;
  });

  const html = `
    <h2>${type}</h2>
    <p><strong>Name:</strong> ${userProfile.name}</p>
    <p><strong>Phone:</strong> ${userProfile.phone}</p>
    <p><strong>Email:</strong> ${userProfile.email}</p>
    <p><strong>Address:</strong> ${userProfile.address}</p>
    <hr>
    ${Object.entries(fields).map(([k,v]) => `<p><strong>${k}:</strong> ${v}</p>`).join("")}
  `;

  document.getElementById("previewContent").innerHTML = html;
}

// SAVE
async function saveDoc(type) {
  const fields = {};
  document.querySelectorAll("#docForm input, #docForm textarea").forEach(f => {
    fields[f.id] = f.value;
  });

  await API.post("/api/documents", {
    type,
    client_name: userProfile.name,
    client_email: userProfile.email,
    client_phone: userProfile.phone,
    client_address: userProfile.address,
    body: fields
  });

  alert(type + " saved!");
}

// EMAIL
async function emailDoc(type) {
  const html = document.getElementById("previewContent").innerHTML;

  await API.post("/api/email", {
    to: userProfile.email,
    subject: type + " from Real Tree Guy OS",
    body: html
  });

  alert(type + " emailed!");
}
