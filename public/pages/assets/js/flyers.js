// ============================================================
// REAL TREE GUY OS — FLYERS / CARDS / DOOR HANGERS STUDIO
// FULL REBUILD (IndexedDB + Profile Auto‑Populate)
// ============================================================

import { initDB, save, getAll } from "./db.js";
await initDB();

/* ============================================================
   DOM ELEMENTS
============================================================ */
const preview = document.getElementById("preview");

const modeCard = document.getElementById("modeCard");
const modeFlyer = document.getElementById("modeFlyer");
const modeDoor = document.getElementById("modeDoorHanger");

const headlineInput = document.getElementById("headline");
const bodyInput = document.getElementById("body");
const offerInput = document.getElementById("offer");

const previewHeadline = document.getElementById("previewHeadline");
const previewBody = document.getElementById("previewBody");
const previewOffer = document.getElementById("previewOffer");
const previewContact = document.getElementById("previewContact");

const bgUpload = document.getElementById("bgUpload");
const bgStrength = document.getElementById("bgStrength");
const previewBg = document.getElementById("previewBg");

const logoUpload = document.getElementById("logoUpload");
const previewLogo = document.getElementById("previewLogo");

const bgColor = document.getElementById("bgColor");
const textColor = document.getElementById("textColor");
const accentColor = document.getElementById("accentColor");

/* ============================================================
   LOAD PROFILE (IndexedDB + LocalStorage)
============================================================ */
async function loadProfile() {
  let p = null;

  const dbProfiles = await getAll("profile");
  if (dbProfiles?.length > 0) p = dbProfiles[0];

  if (!p) {
    try {
      p = JSON.parse(localStorage.getItem("rtg_profile"));
    } catch {
      p = null;
    }
  }

  return p || {
    name: "",
    biz: "",
    phone: "",
    email: "",
    address: "",
    bio: "",
    logo: ""
  };
}

/* ============================================================
   APPLY PROFILE TO FLYER PREVIEW
============================================================ */
(async function applyProfile() {
  const p = await loadProfile();

  previewContact.textContent =
    `${p.biz || p.name} • ${p.phone || ""} • ${p.email || ""}`;

  if (p.logo) previewLogo.style.backgroundImage = p.logo;
})();

/* ============================================================
   MODE SWITCHING
============================================================ */
function setMode(mode) {
  preview.classList.remove("card-mode", "flyer-mode", "door-mode");

  preview.classList.add(
    mode === "door" ? "door-mode" : `${mode}-mode`
  );

  modeCard.classList.toggle("active", mode === "card");
  modeFlyer.classList.toggle("active", mode === "flyer");
  modeDoor.classList.toggle("active", mode === "door");
}

modeCard.onclick = () => setMode("card");
modeFlyer.onclick = () => setMode("flyer");
modeDoor.onclick = () => setMode("door");

/* ============================================================
   LIVE TEXT UPDATES
============================================================ */
headlineInput.oninput = () => previewHeadline.textContent = headlineInput.value;
bodyInput.oninput = () => previewBody.textContent = bodyInput.value;
offerInput.oninput = () => previewOffer.textContent = offerInput.value;

/* ============================================================
   BACKGROUND IMAGE
============================================================ */
bgUpload.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    previewBg.style.backgroundImage = `url('${reader.result}')`;
  };
  reader.readAsDataURL(file);
};

bgStrength.oninput = () => {
  previewBg.style.opacity = bgStrength.value / 100;
};

/* ============================================================
   LOGO UPLOAD (Overrides profile logo)
============================================================ */
logoUpload.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    previewLogo.style.backgroundImage = `url('${reader.result}')`;
  };
  reader.readAsDataURL(file);
};

/* ============================================================
   COLORS
============================================================ */
bgColor.oninput = () => preview.style.backgroundColor = bgColor.value;

textColor.oninput = () => {
  previewHeadline.style.color = textColor.value;
  previewBody.style.color = textColor.value;
};

accentColor.oninput = () => {
  previewOffer.style.color = accentColor.value;
};

/* ============================================================
   SAVE DESIGN
============================================================ */
document.getElementById("saveDesign").onclick = async () => {
  let mode = "card-mode";
  if (preview.classList.contains("flyer-mode")) mode = "flyer-mode";
  if (preview.classList.contains("door-mode")) mode = "door-mode";

  const design = {
    id: "FLY-" + Date.now(),
    mode,
    headline: headlineInput.value,
    body: bodyInput.value,
    offer: offerInput.value,
    bgColor: bgColor.value,
    textColor: textColor.value,
    accentColor: accentColor.value,
    bgStrength: bgStrength.value,
    bgImage: previewBg.style.backgroundImage,
    logoImage: previewLogo.style.backgroundImage
  };

  await save("documents", design);
  alert("Design saved.");
};

/* ============================================================
   LOAD MOST RECENT DESIGN
============================================================ */
(async function loadDesign() {
  const all = await getAll("documents");
  if (!all?.length) return;

  const saved = all.reverse().find(d => d.id.startsWith("FLY-"));
  if (!saved) return;

  headlineInput.value = saved.headline;
  bodyInput.value = saved.body;
  offerInput.value = saved.offer;

  previewHeadline.textContent = saved.headline;
  previewBody.textContent = saved.body;
  previewOffer.textContent = saved.offer;

  bgColor.value = saved.bgColor;
  preview.style.backgroundColor = saved.bgColor;

  textColor.value = saved.textColor;
  previewHeadline.style.color = saved.textColor;
  previewBody.style.color = saved.textColor;

  accentColor.value = saved.accentColor;
  previewOffer.style.color = saved.accentColor;

  bgStrength.value = saved.bgStrength;
  previewBg.style.opacity = saved.bgStrength / 100;

  if (saved.bgImage) previewBg.style.backgroundImage = saved.bgImage;
  if (saved.logoImage) previewLogo.style.backgroundImage = saved.logoImage;

  setMode(
    saved.mode === "card-mode" ? "card" :
    saved.mode === "flyer-mode" ? "flyer" :
    "door"
  );
})();

/* ============================================================
   PRINT
============================================================ */
document.getElementById("printFlyer").onclick = () => window.print();

/* ============================================================
   EMAIL
============================================================ */
document.getElementById("emailFlyer").onclick = () => {
  const subject = encodeURIComponent("My Tree Service Flyer");
  const body = encodeURIComponent("Attached is my flyer design.");
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

/* ============================================================
   SHARE
============================================================ */
document.getElementById("shareFlyer").onclick = async () => {
  if (navigator.share) {
    navigator.share({
      title: "Tree Service Flyer",
      text: "Check out my flyer design."
    });
  } else {
    alert("Sharing not supported on this device.");
  }
};

/* ============================================================
   FULLSCREEN
============================================================ */
document.getElementById("fullscreenFlyer").onclick = () => {
  if (preview.requestFullscreen) preview.requestFullscreen();
};
