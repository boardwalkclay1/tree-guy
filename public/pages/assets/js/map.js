// ============================================================
// REAL TREE GUY MAP ENGINE — MAPLIBRE + WORKER DATA
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api/map";

let map;
let currentType = "home_depot";

const locationStatus = document.getElementById("locationStatus");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");

// ============================================================
// INIT MAP
// ============================================================
function initMap(center = [-84.3880, 33.7490]) { // Atlanta default
  map = new maplibregl.Map({
    container: "rtgMap",
    style: "https://demotiles.maplibre.org/style.json",
    center,
    zoom: 11
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.on("load", () => {
    console.log("MapLibre ready.");
    loadStores(currentType);
  });
}

// ============================================================
// LOAD STORES FROM WORKER
// ============================================================
async function loadStores(type) {
  currentType = type;
  if (activeFilterLabel) activeFilterLabel.textContent = `Filter: ${type}`;

  try {
    const res = await fetch(`${API_BASE}/stores?type=${encodeURIComponent(type)}`);
    const data = await res.json();

    if (!data || !data.features) {
      console.error("Invalid stores GeoJSON", data);
      return;
    }

    // Remove old source/layer if exists
    if (map.getSource("rtg-stores")) {
      map.removeLayer("rtg-stores-layer");
      map.removeSource("rtg-stores");
    }

    map.addSource("rtg-stores", {
      type: "geojson",
      data
    });

    map.addLayer({
      id: "rtg-stores-layer",
      type: "circle",
      source: "rtg-stores",
      paint: {
        "circle-radius": 6,
        "circle-color": "#ff7f00",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#000000"
      }
    });

    map.on("click", "rtg-stores-layer", (e) => {
      const feature = e.features[0];
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates;

      new maplibregl.Popup()
        .setLngLat(coords)
        .setHTML(`
          <strong>${props.name || "Store"}</strong><br>
          ${props.address || ""}<br>
          <small>${props.type || ""}</small>
        `)
        .addTo(map);
    });

    map.on("mouseenter", "rtg-stores-layer", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "rtg-stores-layer", () => {
      map.getCanvas().style.cursor = "";
    });

  } catch (err) {
    console.error("Failed to load stores:", err);
  }
}

// ============================================================
// GEOLOCATION
// ============================================================
function initLocation() {
  if (!navigator.geolocation) {
    if (locationStatus) locationStatus.textContent = "Location not available.";
    initMap();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (locationStatus) locationStatus.textContent = "Location detected.";
      initMap([longitude, latitude]);
    },
    () => {
      if (locationStatus) locationStatus.textContent = "Using default location.";
      initMap();
    }
  );
}

// ============================================================
// FILTER BUTTONS
// ============================================================
function bindFilters() {
  if (!filterRow) return;

  filterRow.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-store-type]");
    if (!btn) return;
    const type = btn.dataset.storeType;
    loadStores(type);
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initLocation();
  bindFilters();
});
