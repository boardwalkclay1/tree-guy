export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const DB = env.DB;

  // ============================
  // SAVED LOCATIONS
  // ============================
  if (path === "/api/map/saved" && request.method === "GET") {
    const { results } = await DB.prepare(
      "SELECT * FROM saved_locations ORDER BY created_at DESC"
    ).all();
    return Response.json(results || []);
  }

  if (path === "/api/map/saved" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO saved_locations (id, label, lat, lng, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(id, body.label, body.lat, body.lng).run();

    return Response.json({ success: true, id });
  }

  // ============================
  // SUPPLY FINDER (OSM Overpass)
  // ============================
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
      "dump": "wood dump"
    };

    const brand = brandMap[type] || "The Home Depot";

    const query = `
      [out:json];
      node["brand"="${brand}"](area:3600062421);
      out;
    `;

    const res = await fetch(
      "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query)
    );

    const data = await res.json();

    const features = data.elements.map(e => ({
      type: "Feature",
      properties: { brand },
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

  // ============================
  // BELTLINE TRAIL
  // ============================
  if (path === "/api/map/beltline") {
    const beltline = await env.ASSETS.fetch("/beltline.geojson");
    return new Response(beltline.body, {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Map route not found", { status: 404 });
}
