// ============================================================
// Real Tree Guy OS — Google Maps Embed Controller (PHONE SAFE)
// ============================================================

const mapFrame = document.getElementById("mapFrame");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const locationStatus = document.getElementById("locationStatus");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;

// ============================================================
// DISABLE FILTERS UNTIL GPS IS READY
// ============================================================
const filterButtons = document.querySelectorAll(".pill");
filterButtons.forEach(btn => btn.disabled = true);

// ============================================================
// GET USER LOCATION (ALWAYS FRESH)
// ============================================================
function getLocation(callback) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;

      locationStatus.textContent =
        `Location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

      // ENABLE FILTERS ONCE GPS IS READY
      filterButtons.forEach(btn => btn.disabled = false);

      callback();
    },
    err => {
      locationStatus.textContent = "Location denied.";
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// ============================================================
// UPDATE MAP EMBED
// ============================================================
function updateMap(filterText) {
  if (!userLat || !userLng) return;

  const q = encodeURIComponent(`${filterText} near ${userLat},${userLng}`);

  mapFrame.src =
    `https://www.google.com/maps?q=${q}&z=13&output=embed`;

  openInMaps.href =
    `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ============================================================
// INITIAL LOAD — FORCE GPS FIRST
// ============================================================
getLocation(() => {
  updateMap("tree service supplies");
});

// ============================================================
// FILTER BUTTONS — FORCE GPS BEFORE EVERY FILTER
// ============================================================
filterRow.addEventListener("click", e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  // PHONE FIX: GET FRESH GPS BEFORE APPLYING FILTER
  getLocation(() => {
    updateMap(type);
  });
});
