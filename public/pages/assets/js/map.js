// ============================================================
// Real Tree Guy OS — Google Maps Embed Controller
// ============================================================

const mapFrame = document.getElementById("mapFrame");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const locationStatus = document.getElementById("locationStatus");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;

// ============================================================
// GET USER LOCATION
// ============================================================
function getLocation(callback) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;

      locationStatus.textContent =
        `Location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

      callback();
    },
    err => {
      locationStatus.textContent = "Location denied.";
    },
    { enableHighAccuracy: true }
  );
}

// ============================================================
// UPDATE MAP EMBED
// ============================================================
function updateMap(filterText) {
  if (!userLat || !userLng) return;

  const q = encodeURIComponent(`${filterText} near ${userLat},${userLng}`);

  const url =
    `https://www.google.com/maps?q=${q}&z=13&output=embed`;

  mapFrame.src = url;

  openInMaps.href =
    `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ============================================================
// INITIAL LOAD
// ============================================================
getLocation(() => {
  updateMap("tree service supplies");
});

// ============================================================
// FILTER BUTTONS
// ============================================================
filterRow.addEventListener("click", e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  getLocation(() => {
    updateMap(type);
  });
});
