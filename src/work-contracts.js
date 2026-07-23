// ============================================================
// REAL TREE GUY OS — CONTRACTS WORKER (FULL ROUTES)
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // ============================================================
  // PROFILE
  // ============================================================
  if (path === "/api/profile") {
    const row = await DB.prepare(`
      SELECT id, name, logo FROM profile LIMIT 1
    `).first();

    return new Response(JSON.stringify(row || {}), {
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }

  // ============================================================
  // TEMPLATES
  // ============================================================
  if (path === "/api/templates") {
    if (request.method === "GET") {
      const rows = await DB.prepare(`
        SELECT id, name, type, scope, body FROM templates
      `).all();

      return new Response(JSON.stringify(rows.results || []), {
        headers: { "Content-Type": "application/json", ...CORS }
      });
    }

    if (request.method === "POST") {
      const body = await request.json();

      const id = crypto.randomUUID();
      await DB.prepare(`
        INSERT INTO templates (id, name, type, scope, body)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, body.name, body.type, body.scope, body.body).run();

      return new Response(JSON.stringify({ id, ...body }), {
        headers: { "Content-Type": "application/json", ...CORS }
      });
    }
  }

  // ============================================================
  // CLIENTS
  // ============================================================
  if (path === "/api/clients") {
    if (request.method === "GET") {
      const rows = await DB.prepare(`
        SELECT id, name, phone, email, address FROM clients
      `).all();

      return new Response(JSON.stringify(rows.results || []), {
        headers: { "Content-Type": "application/json", ...CORS }
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO clients (id, name, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, body.name, body.phone, body.email, body.address).run();

      return new Response(JSON.stringify({ id, ...body }), {
        headers: { "Content-Type": "application/json", ...CORS }
      });
    }
  }

  // ============================================================
  // PHOTO UPLOAD (base64 store)
  // ============================================================
  if (path === "/api/upload-photo") {
    const form = await request.formData();
    const file = form.get("file");

    const id = crypto.randomUUID();
    const base64 = await file.arrayBuffer();

    await DB.prepare(`
      INSERT INTO photos (id, name, data)
      VALUES (?, ?, ?)
    `).bind(id, file.name, base64).run();

    return new Response(JSON.stringify({
      id,
      name: file.name,
      url: `/api/photo?id=${id}`
    }), { headers: { "Content-Type": "application/json", ...CORS } });
  }

  // ============================================================
  // DOCUMENT SAVE
  // ============================================================
  if (path === "/api/documents" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO documents (id, type, client_id, template_id, body, photos, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.type,
      body.client_id,
      body.template_id,
      JSON.stringify(body.body),
      JSON.stringify(body.photos),
      body.created_by
    ).run();

    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }

  // ============================================================
  // EMAIL SEND (stub)
  // ============================================================
  if (path === "/api/email" && request.method === "POST") {
    const body = await request.json();

    // You can integrate SendGrid later
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }

  return new Response(JSON.stringify({ error: "Route not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}
