// ============================================================
// REAL TREE GUY OS — PROFILE ENGINE (IndexedDB + LocalStorage)
// ============================================================

import { initDB, save, getAll } from "../../../assets/js/db.js";

await initDB();

/* ============================================================
   DOM ELEMENTS
============================================================ */
const nameInput    = document.getElementById("profName");
const bizInput     = document.getElementById("profBiz");
const phoneInput   = document.getElementById("profPhone");
const emailInput   = document.getElementById("profEmail");
const addressInput = document.getElementById("profAddress");
const bioInput     = document.getElementById("profBio");
const logoInput    = document.getElementById("profLogo");
const logoPreview  = document.getElementById("logoPreview");

/* ============================================================
   STORAGE HELPERS
============================================================ */
const LS_KEY = "rtg_profile";

function saveLocal(profile) {
  localStorage.setItem(LS_KEY, JSON.stringify(profile));
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || null;
  } catch {
    return null;
  }
}

/* ============================================================
   MERGE PROFILE SOURCES
============================================================ */
async function loadProfileData() {
  const dbProfiles = await getAll("profile");
  const dbProfile = dbProfiles?.[0] || null;
  const lsProfile = loadLocal();

  // DB wins, LS is fallback
  return dbProfile || lsProfile || {
    id: "PROFILE",
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
   POPULATE PAGE FIELDS
============================================================ */
async function populateProfile() {
  const p = await loadProfileData();

  if (nameInput)    nameInput.value = p.name;
  if (bizInput)     bizInput.value = p.biz;
  if (phoneInput)   phoneInput.value = p.phone;
  if (emailInput)   emailInput.value = p.email;
  if (addressInput) addressInput.value = p.address;
  if (bioInput)     bioInput.value = p.bio;

  if (logoPreview && p.logo) {
    logoPreview.style.backgroundImage = p.logo;
  }
}

populateProfile();

/* ============================================================
   LOGO UPLOAD
============================================================ */
if (logoInput) {
  logoInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      logoPreview.style.backgroundImage = `url('${reader.result}')`;
    };
    reader.readAsDataURL(file);
  };
}

/* ============================================================
   SAVE PROFILE (DB + LOCAL)
============================================================ */
async function saveProfile() {
  const profile = {
    id: "PROFILE",
    name: nameInput?.value.trim() || "",
    biz: bizInput?.value.trim() || "",
    phone: phoneInput?.value.trim() || "",
    email: emailInput?.value.trim() || "",
    address: addressInput?.value.trim() || "",
    bio: bioInput?.value.trim() || "",
    logo: logoPreview?.style.backgroundImage || ""
  };

  // Save to IndexedDB
  await save("profile", profile);

  // Save to localStorage
  saveLocal(profile);

  alert("Profile saved.");
}

document.getElementById("saveProfile")?.addEventListener("click", saveProfile);

/* ============================================================
   GLOBAL EXPORT FOR OTHER PAGES
============================================================ */
export async function getProfile() {
  return await loadProfileData();
}
