// ============================================================
// Real Tree Guy OS — FINAL GPS FIX (NO CACHE, NO RANDOM LOCATION)
// ============================================================

const mapFrame = document.getElementById("mapFrame");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const locationStatus = document.getElementById("locationStatus");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;

// ============================================================
// GET REAL GPS — IGNORE FIRST (CACHED) LOCATION
// ============================================================
function getRealLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // iPhone ALWAYS gives a cached location first.
        // Cached locations ALWAYS have a timestamp older than 5 seconds.
        const isFresh = (Date.now() - pos.timestamp) < 5000;

        if (!isFresh) {
          // Cached → request again
          locationStatus.textContent = "Locking GPS…";
          return getRealLocation().then(resolve).catch(reject);
        }

        // FRESH GPS LOCKED
        userLat = lat;
        userLng = lng;

        locationStatus.textContent =
          `GPS Locked: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        resolve();
      },
      err => {
        locationStatus.textContent = "Location denied.";
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // FORCE NO CACHE
      }
    );
  });
}

// ============================================================
// UPDATE MAP
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
// INITIAL LOAD — WAIT FOR REAL GPS
// ============================================================
getRealLocation().then(() => {
  updateMap("tree service supplies");
});

// ============================================================
// FILTERS — WAIT FOR REAL GPS EVERY TIME
// ============================================================
filterRow.addEventListener("click", async e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  locationStatus.textContent = "Getting GPS…";

  await getRealLocation();   // HARD WAIT FOR REAL GPS
  updateMap(type);
});
