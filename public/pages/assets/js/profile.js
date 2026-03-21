const KEY = "rtg_profile_v1";

const nameInput = document.getElementById("profName");
const bizInput = document.getElementById("profBiz");
const phoneInput = document.getElementById("profPhone");
const emailInput = document.getElementById("profEmail");
const addressInput = document.getElementById("profAddress");
const bioInput = document.getElementById("profBio");
const logoInput = document.getElementById("profLogo");
const logoPreview = document.getElementById("logoPreview");

/* LOAD PROFILE */
(function loadProfile() {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (!saved) return;

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

/* LOGO UPLOAD */
logoInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    logoPreview.style.backgroundImage = `url('${reader.result}')`;
  };
  reader.readAsDataURL(file);
};

/* SAVE PROFILE */
document.getElementById("saveProfile").onclick = () => {
  const data = {
    name: nameInput.value.trim(),
    biz: bizInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    bio: bioInput.value.trim(),
    logo: logoPreview.style.backgroundImage || ""
  };

  localStorage.setItem(KEY, JSON.stringify(data));
  alert("Profile saved.");
};
