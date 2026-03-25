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

// YOUR MAPBOX TOKEN (FREE)
// Replace with your token from https://account.mapbox.com/
const MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN_HERE";

// ============================================================
// GET REAL GPS — IGNORE FIRST (CACHED) LOCATION
// ============================================================
function getRealLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const isFresh = (Date.now() - pos.timestamp) < 5000;

        if (!isFresh) {
          locationStatus.textContent = "Locking GPS…";
          return getRealLocation().then(resolve).catch(reject);
        }

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
        maximumAge: 0
      }
    );
  });
}

// ============================================================
// UPDATE MAP — NOW USING MAPBOX STATIC MAP (ALWAYS WORKS)
// ============================================================
function updateMap(filterText) {
  if (userLat === null || userLng === null) return;

  const marker = `pin-s+ff0000(${userLng},${userLat})`;

  // Static map image (loads in ANY iframe)
  mapFrame.src =
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${userLng},${userLat},13/600x600?access_token=${MAPBOX_TOKEN}`;

  // Open in Mapbox full map
  openInMaps.href =
    `https://www.mapbox.com/maps/?zoom=14&center=${userLng},${userLat}`;
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

  await getRealLocation();
  updateMap(type);
});
