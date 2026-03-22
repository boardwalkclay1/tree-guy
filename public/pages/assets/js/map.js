// ============================================================
// Real Tree Guy OS — Google Maps Embed Controller (HARD GPS GATE)
// ============================================================

const mapFrame = document.getElementById("mapFrame");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const locationStatus = document.getElementById("locationStatus");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;

// PROMISE: RESOLVES ONLY AFTER LOCATION IS RECEIVED
function waitForLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;

        locationStatus.textContent =
          `Location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

        resolve();
      },
      err => {
        locationStatus.textContent = "Location denied.";
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// UPDATE MAP EMBED
function updateMap(filterText) {
  if (userLat === null || userLng === null) return;

  const q = encodeURIComponent(`${filterText} near ${userLat},${userLng}`);

  mapFrame.src =
    `https://www.google.com/maps?q=${q}&z=13&output=embed`;

  openInMaps.href =
    `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// INITIAL LOAD — DO NOTHING UNTIL LOCATION IS READY
waitForLocation()
  .then(() => {
    updateMap("tree service supplies");
  })
  .catch(() => {
    // location denied — leave map as-is
  });

// FILTERS — EACH CLICK WAITS FOR LOCATION FIRST
filterRow.addEventListener("click", async e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  locationStatus.textContent = "Getting location…";

  try {
    await waitForLocation();   // HARD WAIT
    updateMap(type);
  } catch (err) {
    // location denied — nothing to update
  }
});
