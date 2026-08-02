// ============================================================
// REAL TREE GUY — MAP WORKER (GLOBAL SUPPLY FINDER + CORS)
// ============================================================

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

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Build Overpass query based on type + lat/lng + radius
function buildQuery(type, lat, lng, radius) {
  switch (type) {
    case "home_depot":
      return `[out:json][timeout:25];
        node["brand"="The Home Depot"](around:${radius},${lat},${lng});
        out;`;
    case "lowes":
      return `[out:json][timeout:25];
        node["brand"="Lowe's"](around:${radius},${lat},${lng});
        out;`;
    case "ace":
      return `[out:json][timeout:25];
        node["brand"="Ace Hardware"](around:${radius},${lat},${lng});
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

// Convert Overpass JSON → GeoJSON FeatureCollection
function overpassToGeoJSON(json, type) {
  const elements = json.elements || [];
  const features = elements
    .filter(e => e.type === "node" && e.lat != null && e.lon != null)
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
        brand: e.tags?.brand || "",
        raw: e.tags || {},
        // gas price placeholders (to be filled by a real fuel API later)
        price_regular: null,
        price_ultra: null,
        price_diesel: null
      }
    }));

  return {
    type: "FeatureCollection",
    features
  };
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const DB = env.DB;

  // ============================================================
  // CORS PRE-FLIGHT
  // ============================================================
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
  // SAVED LOCATIONS (GET)
  // ============================================================
  if (path === "/api/map/saved" && request.method === "GET") {
    const { results } = await DB.prepare(
      "SELECT * FROM saved_locations ORDER BY created_at DESC"
    ).all();
    return cors(results || []);
  }

  // ============================================================
  // SAVED LOCATIONS (POST)
  // ============================================================
  if (path === "/api/map/saved" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO saved_locations (id, label, lat, lng, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, body.label, body.lat, body.lng, Date.now()).run();

    return cors({ success: true, id });
  }

  // ============================================================
  // SUPPLY FINDER — GLOBAL Overpass API
  // ============================================================
  if (path === "/api/map/stores" && request.method === "GET") {
    const type = url.searchParams.get("type") || "home_depot";
    const lat = url.searchParams.get("lat") || "33.7490";   // default Atlanta
    const lng = url.searchParams.get("lng") || "-84.3880";  // default Atlanta
    const radius = url.searchParams.get("radius") || "50000"; // 50km

    const query = buildQuery(type, lat, lng, radius);

    let data;
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        body: query
      });

      if (!res.ok) {
        return cors(
          { error: "Overpass API failed", status: res.status },
          500
        );
      }

      data = await res.json();
    } catch (err) {
      return cors({ error: "Overpass API failed", details: err.message }, 500);
    }

    const geojson = overpassToGeoJSON(data, type);
    return cors(geojson);
  }

  // ============================================================
  // BELTLINE TRAIL
  // ============================================================
  if (path === "/api/map/beltline") {
    const file = await env.ASSETS.fetch("/beltline.geojson");
    return new Response(file.body, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return cors({ error: "Map route not found" }, 404);
}
