// ============================================================
// REAL TREE GUY — MAP WORKER (FINAL WITH CORS)
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
  // SUPPLY FINDER — Overpass API
  // ============================================================
  if (path === "/api/map/stores" && request.method === "GET") {
    const type = url.searchParams.get("type");

    const brandMap = {
      "home_depot": "The Home Depot",
      "lowes": "Lowe's",
      "ace": "Ace Hardware",
      "gas": "gas",
      "sawmill": "sawmill",
      "woodworking": "woodworking",
      "chainsaw": "chainsaw",
      "dump": "waste_disposal"
    };

    const brand = brandMap[type] || "The Home Depot";

    const query = `
      [out:json][timeout:25];
      (
        node["name"="${brand}"](33.0,-85.0,34.2,-83.5);
        node["brand"="${brand}"](33.0,-85.0,34.2,-83.5);
        node["shop"="${brand}"](33.0,-85.0,34.2,-83.5);
        node["industrial"="${brand}"](33.0,-85.0,34.2,-83.5);
        node["amenity"="${brand}"](33.0,-85.0,34.2,-83.5);
      );
      out center;
    `;

    let data;
    try {
      const res = await fetch(
        "https://overpass-api.de/api/interpreter?data=" +
        encodeURIComponent(query)
      );
      data = await res.json();
    } catch (err) {
      return cors({ error: "Overpass API failed", details: err.message }, 500);
    }

    const features = (data.elements || []).map(e => ({
      type: "Feature",
      properties: {
        brand,
        name: e.tags?.name || brand,
        raw: e.tags || {}
      },
      geometry: {
        type: "Point",
        coordinates: [e.lon, e.lat]
      }
    }));

    return cors({
      type: "FeatureCollection",
      features
    });
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
