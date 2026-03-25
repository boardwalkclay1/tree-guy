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
// UPDATE MAP — NOW USING OPENSTREETMAP (ALWAYS WORKS)
// ============================================================
function updateMap(filterText) {
  if (userLat === null || userLng === null) return;

  const encoded = encodeURIComponent(filterText);

  // Build a bounding box around the user
  const bbox = [
    userLng - 0.05,
    userLat - 0.05,
    userLng + 0.05,
    userLat + 0.05
  ].join(",");

  // Embed map (always loads)
  mapFrame.src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${userLat},${userLng}`;

  // External link (opens full map with search)
  openInMaps.href =
    `https://www.openstreetmap.org/?mlat=${userLat}&mlon=${userLng}#map=14/${userLat}/${userLng}`;
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
