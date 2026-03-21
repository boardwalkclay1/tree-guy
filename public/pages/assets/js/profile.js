// profile.js — Real Tree Guy OS (IndexedDB Version)

import { initDB, save, getAll, get, remove } from "../../../assets/js/db.js";

await initDB();

/* ============================================================
   DOM ELEMENTS
   ============================================================ */
const nameInput = document.getElementById("profName");
const bizInput = document.getElementById("profBiz");
const phoneInput = document.getElementById("profPhone");
const emailInput = document.getElementById("profEmail");
const addressInput = document.getElementById("profAddress");
const bioInput = document.getElementById("profBio");
const logoInput = document.getElementById("profLogo");
const logoPreview = document.getElementById("logoPreview");

/* ============================================================
   LOAD PROFILE (IndexedDB)
   ============================================================ */
(async function loadProfile() {
  const all = await getAll("profile");
  if (!all || all.length === 0) return;

  const saved = all[0]; // only one profile stored

  nameInput.value = saved.name || "";
  bizInput.value = saved.biz || "";
  phoneInput.value = saved.phone || "";
  emailInput.value = saved.email || "";
  addressInput.value = saved.address || "";
  bioInput.value = saved.bio || "";

  if (saved.logo) {
    logoPreview.style.backgroundImage = saved.logo;
  }
})();

/* ============================================================
   LOGO UPLOAD
   ============================================================ */
logoInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    logoPreview.style.backgroundImage = `url('${reader.result}')`;
  };
  reader.readAsDataURL(file);
};

/* ============================================================
   SAVE PROFILE (IndexedDB)
   ============================================================ */
document.getElementById("saveProfile").onclick = async () => {
  const data = {
    id: "PROFILE",
    name: nameInput.value.trim(),
    biz: bizInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    bio: bioInput.value.trim(),
    logo: logoPreview.style.backgroundImage || ""
  };

  await save("profile", data);

  alert("Profile saved.");
};
