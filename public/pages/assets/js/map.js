// ============================================================
// REAL TREE GUY MAP ENGINE — FIXED VERSION
// ============================================================

const API_BASE = "https://api.realtreeguy.com/api/map";

let map;
let currentType = "home_depot";

const locationStatus = document.getElementById("locationStatus");
const filterRow = document.getElementById("filterRow");
const activeFilterLabel = document.getElementById("activeFilterLabel");

let userCoords = null; // store user location until map loads

// ============================================================
// INIT MAP
// ============================================================
function initMap(center = [-84.3880, 33.7490]) {
  map = new maplibregl.Map({
    container: "rtgMap",
    style: "https://demotiles.maplibre.org/style.json",
    center,
    zoom: 11
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  map.on("load", () => {
    console.log("MapLibre ready.");

    // Add user marker ONLY after style is loaded
    if (userCoords) {
      addUserLocationMarker(userCoords.lng, userCoords.lat);
    }

    loadStores(currentType);
  });
}

// ============================================================
// USER LOCATION MARKER — SAFE (only after map load)
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

    // Remove old store layer
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

      if (props.type === "gas") {
        html += `
          <br><br>
          Regular: $${props.price_regular?.toFixed(2) || "—"}<br>
          Ultra (89): $${props.price_ultra?.toFixed(2) || "—"}<br>
          Diesel: $${props.price_diesel?.toFixed(2) || "—"}
        `;
      }

      new maplibregl.Popup()
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map);
    });

    if (type === "gas") {
      highlightCheapestGas(data);
    }

  } catch (err) {
    console.error("Failed to load stores:", err);
  }
}

// ============================================================
// CHEAPEST GAS
// ============================================================
function highlightCheapestGas(geojson) {
  if (!geojson || !geojson.features || !geojson.features.length) return;

  let cheapestFeature = null;
  let cheapestPrice = Infinity;

  for (const f of geojson.features) {
    const p = f.properties || {};
    const price = Number(p.price_regular);
    if (!isNaN(price) && price < cheapestPrice) {
      cheapestPrice = price;
      cheapestFeature = f;
    }
  }

  if (!cheapestFeature) return;

  const coords = cheapestFeature.geometry.coordinates;

  if (map.getSource("rtg-cheapest-gas")) {
    map.removeLayer("rtg-cheapest-gas-layer");
    map.removeSource("rtg-cheapest-gas");
  }

  map.addSource("rtg-cheapest-gas", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [cheapestFeature]
    }
  });

  map.addLayer({
    id: "rtg-cheapest-gas-layer",
    type: "circle",
    source: "rtg-cheapest-gas",
    paint: {
      "circle-radius": 10,
      "circle-color": "#00ff99",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#000000"
    }
  });

  map.flyTo({ center: coords, zoom: 13 });
}

// ============================================================
// GEOLOCATION — FIXED
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
