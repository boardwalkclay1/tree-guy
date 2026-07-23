// ============================================================
// REAL TREE GUY OS — CONTRACTS WORKER (FINAL UPDATED VERSION)
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...CORS }
    });

  // ============================================================
  // LIST ALL TEMPLATES
  // ============================================================
  if (path === "/api/templates" && request.method === "GET") {
    try {
      const list = [
        "change_order.json",
        "client_contract.json",
        "commercial_contract.json",
        "credit_card.json",
        "crew_split.json",
        "deposit.json",
        "estimate.json",
        "groundy.json",
        "hire_climb.json",
        "multo_day_groundy.json",
        "referral.json",
        "self_climb.json",
        "storm_cleanup.json",
        "stump_grinder.json"
      ];

      return json(
        list.map(name => ({
          id: name.replace(".json", ""),
          file: name,
          name: name.replace(".json", "").replace(/_/g, " ")
        }))
      );
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ============================================================
  // GET SINGLE TEMPLATE FILE
  // ============================================================
  if (path.startsWith("/api/templates/") && request.method === "GET") {
    try {
      const id = path.split("/").pop();
      const fileName = `${id}.json`;

      const file = await env.ASSETS.fetch(`/json/contracts/${fileName}`);
      const text = await file.text();

      return json(JSON.parse(text));
    } catch (err) {
      return json({ error: "Template not found", details: err.message }, 404);
    }
  }

  // ============================================================
  // CLIENTS
  // ============================================================
  if (path === "/api/clients") {
    if (request.method === "GET") {
      const rows = await DB.prepare(`
        SELECT id, name, phone, email, address
        FROM clients
        ORDER BY name ASC
      `).all();
      return json(rows.results || []);
    }

    if (request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO clients (id, name, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, body.name, body.phone, body.email, body.address).run();

      return json({ id, ...body });
    }
  }

  // ============================================================
  // PHOTO UPLOAD
  // ============================================================
  if (path === "/api/upload-photo" && request.method === "POST") {
    const form = await request.formData();
    const file = form.get("file");

    const id = crypto.randomUUID();
    const buf = await file.arrayBuffer();

    await DB.prepare(`
      INSERT INTO photos (id, name, data)
      VALUES (?, ?, ?)
    `).bind(id, file.name, buf).run();

    return json({
      id,
      name: file.name,
      url: `/api/photo?id=${id}`
    });
  }

  // ============================================================
  // PHOTO FETCH
  // ============================================================
  if (path === "/api/photo" && request.method === "GET") {
    const id = url.searchParams.get("id");

    const row = await DB.prepare(`
      SELECT name, data FROM photos WHERE id = ?
    `).bind(id).first();

    if (!row) return json({ error: "Not found" }, 404);

    return new Response(row.data, {
      headers: { "Content-Type": "image/jpeg", ...CORS }
    });
  }

  // ============================================================
  // SAVE DOCUMENT (contract instance)
// ============================================================
  if (path === "/api/documents" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO documents (id, type, client_id, template_id, body, photos, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.type,
      body.client_id,
      body.template_id,
      JSON.stringify(body.body),
      JSON.stringify(body.photos),
      body.created_by,
      Date.now()
    ).run();

    return json({ id });
  }

  // ============================================================
  // EMAIL SEND (stub)
// ============================================================
  if (path === "/api/email" && request.method === "POST") {
    const body = await request.json();
    return json({ ok: true, sent_to: body.to });
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return json({ error: "Route not found" }, 404);
}
