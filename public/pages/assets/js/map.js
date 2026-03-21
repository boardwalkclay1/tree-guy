// ============================================================
// Real Tree Guy OS — Interactive Map (Leaflet Version)
// ============================================================

const locationStatus = document.getElementById("locationStatus");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const directionsFromUserBtn = document.getElementById("directionsFromUser");
const directionsFromClientBtn = document.getElementById("directionsFromClient");
const clientAddressInput = document.getElementById("clientAddress");
const openInMaps = document.getElementById("openInMaps");

let userLat = null;
let userLng = null;

// ============================================================
// INIT MAP
// ============================================================
const map = L.map("map").setView([0, 0], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

let userMarker = null;
let supplyMarkers = [];

// ============================================================
// GET USER LOCATION
// ============================================================
function getLocation(cb) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;

      locationStatus.textContent =
        `Location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;

      if (!userMarker) {
        userMarker = L.marker([userLat, userLng]).addTo(map);
      } else {
        userMarker.setLatLng([userLat, userLng]);
      }

      map.setView([userLat, userLng], 14);

      cb(userLat, userLng);
    },
    () => {
      locationStatus.textContent = "Location denied.";
    },
    { enableHighAccuracy: true }
  );
}

// ============================================================
// SEARCH SUPPLIES USING NOMINATIM
// ============================================================
async function searchSupplies(type, lat, lng) {
  // Clear old markers
  supplyMarkers.forEach(m => map.removeLayer(m));
  supplyMarkers = [];

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(type)}&format=json&limit=10&` +
    `viewbox=${lng - 0.1},${lat + 0.1},${lng + 0.1},${lat - 0.1}&bounded=1`;

  const res = await fetch(url);
  const data = await res.json();

  data.forEach(place => {
    const marker = L.marker([place.lat, place.lon])
      .addTo(map)
      .bindPopup(`<b>${place.display_name}</b>`);
    supplyMarkers.push(marker);
  });

  openInMaps.href =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(type)}+near+${lat},${lng}`;
}

// ============================================================
// INITIAL LOAD
// ============================================================
getLocation((lat, lng) => {
  searchSupplies("tree service supplies", lat, lng);
});

// ============================================================
// FILTER CLICK
// ============================================================
filterRow.addEventListener("click", e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  getLocation((lat, lng) => {
    searchSupplies(type, lat, lng);
  });
});

// ============================================================
// DIRECTIONS
// ============================================================
function buildDirectionsUrl(origin, destination) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
}

directionsFromUserBtn.onclick = () => {
  const type = activeFilterLabel.textContent;
  if (type === "None") return alert("Select a supply filter first.");

  getLocation((lat, lng) => {
    const origin = `${lat},${lng}`;
    window.open(buildDirectionsUrl(origin, type), "_blank");
  });
};

directionsFromClientBtn.onclick = () => {
  const client = clientAddressInput.value.trim();
  if (!client) return alert("Enter a client address first.");

  const type = activeFilterLabel.textContent;
  if (type === "None") return alert("Select a supply filter first.");

  window.open(buildDirectionsUrl(client, type), "_blank");
};
