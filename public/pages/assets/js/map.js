// ============================================================
// Real Tree Guy OS — Google Maps Embed Controller (FINAL FIX)
// ============================================================

const mapFrame = document.getElementById("mapFrame");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const locationStatus = document.getElementById("locationStatus");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;
let gpsReady = false; // ⭐ NEW — replaces disabled buttons

// ============================================================
// GET USER LOCATION (ALWAYS FRESH)
// ============================================================
function getLocation(callback) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;

      gpsReady = true; // ⭐ GPS is ready

      locationStatus.textContent =
        `Location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

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
  if (userLat === null || userLng === null) return;

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
// FILTER BUTTONS — SAFE ON PHONE + DESKTOP
// ============================================================
filterRow.addEventListener("click", e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;

  // ⭐ Prevent filters from firing before GPS is ready
  if (!gpsReady) {
    locationStatus.textContent = "Waiting for GPS…";
    return;
  }

  activeFilterLabel.textContent = type;

  // ⭐ Always refresh GPS before applying filter
  getLocation(() => {
    updateMap(type);
  });
});
