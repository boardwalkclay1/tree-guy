// ============================================================
// REAL TREE GUY MAP WORKER — GLOBAL STORES (FINAL)
// ============================================================

const OVERPASS = "https://overpass-api.de/api/interpreter";

function cors(json, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function buildQuery(type, lat, lng, radius) {
  switch (type) {
    case "home_depot":
      return `[out:json][timeout:25];
        node["name"~"Home Depot"](around:${radius},${lat},${lng});
        out;`;

    case "lowes":
      return `[out:json][timeout:25];
        node["name"~"Lowe"](around:${radius},${lat},${lng});
        out;`;

    case "ace":
      return `[out:json][timeout:25];
        node["name"~"Ace Hardware"](around:${radius},${lat},${lng});
        out;`;

    case "chainsaw":
      return `[out:json][timeout:25];
        node["shop"="hardware"](around:${radius},${lat},${lng});
        out;`;

    case "woodworking":
      return `[out:json][timeout:25];
        node["shop"="wood"](around:${radius},${lat},${lng});
        out;`;

    case "dump":
      return `[out:json][timeout:25];
        node["amenity"="waste_disposal"](around:${radius},${lat},${lng});
        out;`;

    case "sawmill":
      return `[out:json][timeout:25];
        node["industrial"="sawmill"](around:${radius},${lat},${lng});
        out;`;

    case "gas":
      return `[out:json][timeout:25];
        node["amenity"="fuel"](around:${radius},${lat},${lng});
        out;`;

    default:
      return `[out:json][timeout:25];
        node(around:${radius},${lat},${lng});
        out;`;
  }
}

function toGeoJSON(json, type) {
  const features = (json.elements || [])
    .filter(e => e.type === "node" && e.lat && e.lon)
    .map(e => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [e.lon, e.lat]
      },
      properties: {
        type,
        name: e.tags?.name || "",
        address: e.tags?.["addr:full"] || "",
        raw: e.tags || {}
      }
    }));

  return {
    type: "FeatureCollection",
    features
  };
}

export async function handle(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // ============================================================
  // STORES ENDPOINT
  // ============================================================
  if (path === "/api/map/stores" && request.method === "GET") {
    const type = url.searchParams.get("type") || "home_depot";
    const lat = url.searchParams.get("lat") || "33.7490";
    const lng = url.searchParams.get("lng") || "-84.3880";
    const radius = url.searchParams.get("radius") || "50000";

    const query = buildQuery(type, lat, lng, radius);

    try {
      const res = await fetch(OVERPASS, {
        method: "POST",
        body: query
      });

      if (!res.ok) {
        return cors({ error: "Overpass failed", status: res.status }, 500);
      }

      const json = await res.json();
      return cors(toGeoJSON(json, type));
    } catch (err) {
      return cors({ error: "Overpass error", details: err.message }, 500);
    }
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return cors({ error: "Route not found" }, 404);
}
