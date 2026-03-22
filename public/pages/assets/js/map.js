// ============================================================
// Real Tree Guy OS — GPS MUST BE FRESH (NO CACHED LOCATION)
// ============================================================

const mapFrame = document.getElementById("mapFrame");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const locationStatus = document.getElementById("locationStatus");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;

// FORCE REAL GPS — NO CACHED LOCATION ALLOWED
function getFreshLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        // IGNORE CACHED LOCATIONS
        if (pos.coords.accuracy > 100) {
          // accuracy too low = cached or stale
          locationStatus.textContent = "Locking real GPS…";
          return getFreshLocation().then(resolve).catch(reject);
        }

        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;

        locationStatus.textContent =
          `GPS Locked: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

        resolve();
      },
      err => {
        locationStatus.textContent = "Location denied.";
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // ⭐ ZERO CACHE
      }
    );
  });
}

function updateMap(filterText) {
  if (userLat === null || userLng === null) return;

  const q = encodeURIComponent(`${filterText} near ${userLat},${userLng}`);

  mapFrame.src =
    `https://www.google.com/maps?q=${q}&z=13&output=embed`;

  openInMaps.href =
    `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// INITIAL LOAD — WAIT FOR REAL GPS
getFreshLocation().then(() => {
  updateMap("tree service supplies");
});

// FILTERS — WAIT FOR REAL GPS EVERY TIME
filterRow.addEventListener("click", async e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  locationStatus.textContent = "Getting real GPS…";

  await getFreshLocation();  // ⭐ HARD WAIT FOR REAL GPS
  updateMap(type);
});
