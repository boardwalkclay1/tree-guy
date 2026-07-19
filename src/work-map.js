// ============================================================
// REAL TREE GUY OS — MAP WORKER (D1 + Overpass)
// ============================================================

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const DB = env.DB;

  // ============================================================
  // SAVED LOCATIONS (GET ALL)
  // ============================================================
  if (path === "/api/map/saved" && request.method === "GET") {
    const { results } = await DB.prepare(
      "SELECT * FROM saved_locations ORDER BY created_at DESC"
    ).all();

    return Response.json(results || []);
  }

  // ============================================================
  // SAVED LOCATIONS (ADD)
  // ============================================================
  if (path === "/api/map/saved" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO saved_locations (id, label, lat, lng, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, body.label, body.lat, body.lng, Date.now()).run();

    return Response.json({ success: true, id });
  }

  // ============================================================
  // SUPPLY FINDER — Overpass API
  // ============================================================
  if (path === "/api/map/stores" && request.method === "GET") {
    const type = url.searchParams.get("type");

    // Map your filter types to Overpass search terms
    const brandMap = {
      "home_depot": 'The Home Depot',
      "lowes": "Lowe's",
      "ace": "Ace Hardware",
      "gas": "gas",
      "sawmill": "sawmill",
      "woodworking": "woodworking",
      "chainsaw": "chainsaw",
      "dump": "waste_disposal"
    };

    const brand = brandMap[type] || "The Home Depot";

    // Overpass query — using Atlanta metro area bounding box
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
      return Response.json(
        { error: "Overpass API failed", details: err.message },
        { status: 500 }
      );
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

    return Response.json({
      type: "FeatureCollection",
      features
    });
  }

  // ============================================================
  // BELTLINE TRAIL (STATIC GEOJSON)
  // ============================================================
  if (path === "/api/map/beltline") {
    const file = await env.ASSETS.fetch("/beltline.geojson");
    return new Response(file.body, {
      headers: { "Content-Type": "application/json" }
    });
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return Response.json({ error: "Map route not found" }, { status: 404 });
}
