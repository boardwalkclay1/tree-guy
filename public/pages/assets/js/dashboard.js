// =========================
// AUTH (LOCAL ONLY)
// =========================
import { isUnlocked } from "/pages/assets/js/auth.js";

if (!(await isUnlocked())) {
  window.location.href = "/pages/login.html";
}

// =========================
// HAMBURGER MENU
// =========================
const burger = document.getElementById("rtgBurger");
const sidemenu = document.getElementById("rtgSidemenu");

burger.addEventListener("click", () => {
  sidemenu.classList.toggle("open");
});

// =========================
// MAP LOGIC
// =========================
const dashMap = document.getElementById("rtgMap");
const dashFilterButtons = document.querySelectorAll("#rtg-filters button");
const radiusEl = document.getElementById("rtgRadius");

const DEFAULT_ZOOM = 14;

function setRadiusText(zoom) {
  let miles = 5;
  if (zoom >= 15) miles = 2;
  if (zoom >= 16) miles = 1;
  radiusEl.textContent = `Searching within ~${miles} miles of your location.`;
}

function updateMapWithType(type) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const q = `${type} near ${lat},${lng}`;
      const zoom = DEFAULT_ZOOM;

      dashMap.src =
        `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;

      setRadiusText(zoom);
    },
    () => {
      const q = `${type} near me`;
      const zoom = 13;

      dashMap.src =
        `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;

      radiusEl.textContent =
        "Location denied. Showing results near your device's map region.";
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// =========================
// INITIAL LOAD
// =========================
updateMapWithType("tree service supplies");

// =========================
// FILTER BUTTONS
// =========================
dashFilterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    updateMapWithType(type);
  });
});
