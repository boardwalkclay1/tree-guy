// ============================================================
// REAL TREE GUY MAP ENGINE — MAPLIBRE + OSM + WORKER DATA
// ============================================================

let userLat = null;
let userLng = null;

const locationStatus = document.getElementById("locationStatus");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");

// ============================================================
// GET REAL GPS
// ============================================================
async function getRealLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
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
        maximumAge: 0
      }
    );
  });
}

// ============================================================
// INIT MAPLIBRE MAP
// ============================================================
const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/bright",
  center: [-84.39, 33.78], // Atlanta
  zoom: 12
});

// ============================================================
// LOAD STORE DATA FROM CLOUDFLARE WORKER
// ============================================================
async function loadStores(filterType) {
  const res = await fetch(`/api/map/stores?type=${filterType}`);
  const geojson = await res.json();

  if (map.getSource("rtg-stores")) {
    map.getSource("rtg-stores").setData(geojson);
    return;
  }

  map.addSource("rtg-stores", {
    type: "geojson",
    data: geojson
  });

  map.addLayer({
    id: "rtg-stores-layer",
    type: "circle",
    source: "rtg-stores",
    paint: {
      "circle-radius": 6,
      "circle-color": [
        "match",
        ["get", "brand"],
        "Home Depot", "#ff6600",
        "Lowe's", "#0066ff",
        "Ace Hardware", "#00cc44",
        "#00ff88"
      ]
    }
  });
}

// ============================================================
// FILTER BUTTONS
// ============================================================
filterRow.addEventListener("click", async e => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  const type = btn.dataset.type;
  activeFilterLabel.textContent = type;

  await loadStores(type);
});

// ============================================================
// INITIAL LOAD
// ============================================================
getRealLocation().then(() => {
  loadStores("home_depot");
});
