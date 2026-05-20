// ============================================================
// REAL TREE GUY OS — PROFILE ENGINE (D1 VERSION)
// ============================================================

async function apiGetProfile() {
    const res = await fetch("/api/profile");
    return await res.json();
}

async function apiSaveProfile(profile) {
    await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
    });
}

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
   LOAD PROFILE
============================================================ */
async function populateProfile() {
    const p = await apiGetProfile();

    nameInput.value    = p.name || "";
    bizInput.value     = p.biz || "";
    phoneInput.value   = p.phone || "";
    emailInput.value   = p.email || "";
    addressInput.value = p.address || "";
    bioInput.value     = p.bio || "";

    if (p.logo) logoPreview.style.backgroundImage = p.logo;
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
   SAVE PROFILE
============================================================ */
async function saveProfile() {
    const profile = {
        id: "PROFILE",
        name: nameInput.value.trim(),
        biz: bizInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        address: addressInput.value.trim(),
        bio: bioInput.value.trim(),
        logo: logoPreview.style.backgroundImage || ""
    };

    await apiSaveProfile(profile);
    alert("Profile saved.");
}

document.getElementById("saveProfile")?.addEventListener("click", saveProfile);

/* ============================================================
   EXPORT FOR OTHER PAGES
============================================================ */
export async function getProfile() {
    return await apiGetProfile();
}
