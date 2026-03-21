// ============================================================
// Real Tree Guy OS — Map Module (Local-First Version)
// ============================================================

const mapFrame = document.getElementById("mapFrame");
const locationStatus = document.getElementById("locationStatus");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const directionsFromUserBtn = document.getElementById("directionsFromUser");
const directionsFromClientBtn = document.getElementById("directionsFromClient");
const clientAddressInput = document.getElementById("clientAddress");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;

const DEFAULT_ZOOM = 14;

/* ============================================================
   MAP UPDATE
   ============================================================ */
function updateMap(type, lat, lng) {
  const q = `${type} near ${lat},${lng}`;
  const encoded = encodeURIComponent(q);

  mapFrame.src =
    `https://www.google.com/maps?q=${encoded}&z=${DEFAULT_ZOOM}&output=embed`;

  openInMaps.href =
    `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

function fallbackMap(type) {
  const q = `${type} near me`;
  const encoded = encodeURIComponent(q);

  mapFrame.src =
    `https://www.google.com/maps?q=${encoded}&z=13&output=embed`;

  openInMaps.href =
    `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  locationStatus.textContent =
    "Location denied. Showing results near your device region.";
}

/* ============================================================
   REQUEST LOCATION
   ============================================================ */
function requestLocation(type, cb) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;

      locationStatus.textContent =
        `Location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

      cb(userLat, userLng);
    },
    () => fallbackMap(type),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

/* ============================================================
   INITIAL LOAD
   ============================================================ */
requestLocation("tree service supplies", (lat, lng) => {
  updateMap("tree service supplies", lat, lng);
});

/* ============================================================
   FILTERS
   ============================================================ */
filterRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  requestLocation(type, (lat, lng) => updateMap(type, lat, lng));
});

/* ============================================================
   DIRECTIONS
   ============================================================ */
function buildDirectionsUrl(origin, destination) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
}

directionsFromUserBtn.addEventListener("click", () => {
  const type = activeFilterLabel.textContent;
  if (type === "None") return alert("Select a supply filter first.");

  requestLocation(type, (lat, lng) => {
    const origin = `${lat},${lng}`;
    window.open(buildDirectionsUrl(origin, type), "_blank");
  });
});

directionsFromClientBtn.addEventListener("click", () => {
  const client = clientAddressInput.value.trim();
  if (!client) return alert("Enter a client address first.");

  const type = activeFilterLabel.textContent;
  if (type === "None") return alert("Select a supply filter first.");

  window.open(buildDirectionsUrl(client, type), "_blank");
});
