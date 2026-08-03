// ============================================================
// REAL TREE GUY MAP ENGINE — CLEAN GLOBAL VERSION (FINAL)
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api/map";

let map;
let currentType = "home_depot";

const locationStatus = document.getElementById("locationStatus");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");

let userCoords = null;

// ============================================================
// INIT MAP
// ============================================================
function initMap(center = [-84.3880, 33.7490]) {
  map = new maplibregl.Map({
    container: "rtgMap",
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256
        }
      },
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm"
        }
      ]
    },
    center,
    zoom: 11
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.on("load", () => {
    console.log("MapLibre ready.");

    if (userCoords) {
      addUserLocationMarker(userCoords.lng, userCoords.lat);
    }

    loadStores(currentType);
  });
}

// ============================================================
// USER LOCATION MARKER
// ============================================================
function addUserLocationMarker(lng, lat) {
  if (!map || !map.isStyleLoaded()) return;

  if (map.getSource("rtg-user")) {
    map.removeLayer("rtg-user-layer");
    map.removeSource("rtg-user");
  }

  map.addSource("rtg-user", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: {}
        }
      ]
    }
  });

  map.addLayer({
    id: "rtg-user-layer",
    type: "circle",
    source: "rtg-user",
    paint: {
      "circle-radius": 8,
      "circle-color": "#00ff99",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#000000"
    }
  });
}

// ============================================================
// LOAD STORES — GLOBAL
// ============================================================
async function loadStores(type) {
  currentType = type;
  activeFilterLabel.textContent = type;

  const center = map.getCenter();
  const lat = center.lat;
  const lng = center.lng;
  const radius = 50000; // 50km

  try {
    const res = await fetch(
      `${API_BASE}/stores?type=${encodeURIComponent(type)}&lat=${lat}&lng=${lng}&radius=${radius}`
    );

    const data = await res.json();

    if (!data || !data.features) {
      console.error("Invalid stores GeoJSON", data);
      return;
    }

    if (map.getSource("rtg-stores")) {
      map.removeLayer("rtg-stores-layer");
      map.removeSource("rtg-stores");
    }

    map.addSource("rtg-stores", {
      type: "geojson",
      data
    });

    const colorMap = {
      home_depot: "#ff6600",
      lowes: "#0066ff",
      ace: "#00cc44",
      chainsaw: "#ff3333",
      woodworking: "#cc8800",
      dump: "#884400",
      sawmill: "#228833",
      gas: "#ffeb3b"
    };

    map.addLayer({
      id: "rtg-stores-layer",
      type: "circle",
      source: "rtg-stores",
      paint: {
        "circle-radius": 6,
        "circle-color": colorMap[type] || "#ff7f00",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#000000"
      }
    });

    map.on("click", "rtg-stores-layer", (e) => {
      const feature = e.features[0];
      const props = feature.properties || {};
      const coords = feature.geometry.coordinates;

      let html = `
        <strong>${props.name || "Location"}</strong><br>
        ${props.address || ""}<br>
        <small>${props.type || ""}</small>
      `;

      new maplibregl.Popup()
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map);
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
    locationStatus.textContent = "Location not available.";
    initMap();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      userCoords = { lng: longitude, lat: latitude };

      locationStatus.textContent = "Location detected.";

      initMap([longitude, latitude]);
    },
    () => {
      locationStatus.textContent = "Using default location.";
      initMap();
    }
  );
}

// ============================================================
// FILTER BUTTONS
// ============================================================
function bindFilters() {
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
