export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const DB = env.DB;

    // ============================
    // PROFILE
    // ============================
    if (path === "/api/profile" && request.method === "GET") {
      const { results } = await DB.prepare(`
        SELECT * FROM user_profile LIMIT 1
      `).all();
      return Response.json(results[0] || {});
    }

    // ============================
    // CUSTOMERS
    // ============================
    if (path === "/api/customers" && request.method === "GET") {
      const { results } = await DB.prepare(`
        SELECT * FROM customers ORDER BY created_at DESC
      `).all();
      return Response.json(results || []);
    }

    if (path === "/api/customers" && request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO customers (id, name, email, phone, address, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        body.name,
        body.email || null,
        body.phone || null,
        body.address || null
      ).run();

      return Response.json({ success: true, id });
    }

    // ============================
    // JOBS
    // ============================
    if (path === "/api/jobs" && request.method === "GET") {
      const { results } = await DB.prepare(`
        SELECT * FROM jobs ORDER BY created_at DESC
      `).all();
      return Response.json(results || []);
    }

    if (path === "/api/jobs" && request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO jobs (id, customer_id, description, price, status, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        body.customer_id,
        body.description,
        body.price,
        body.status || "pending"
      ).run();

      return Response.json({ success: true, id });
    }

    // ============================
    // TEMPLATES
    // ============================
    if (path === "/api/templates" && request.method === "GET") {
      const { results } = await DB.prepare(`
        SELECT * FROM templates ORDER BY created_at DESC
      `).all();
      return Response.json(results || []);
    }

    if (path === "/api/templates" && request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO templates (id, name, type, scope, body, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        body.name,
        body.type || "Tree Work Contract",
        body.scope || "",
        body.body || ""
      ).run();

      const { results } = await DB.prepare(`
        SELECT * FROM templates WHERE id = ?
      `).bind(id).all();

      return Response.json(results[0] || { id });
    }

    // ============================
    // DOCUMENTS (NEW CONTRACTS CENTER)
    // ============================
    if (path === "/api/documents" && request.method === "GET") {
      const { results } = await DB.prepare(`
        SELECT * FROM contracts ORDER BY created_at DESC
      `).all();
      return Response.json(results || []);
    }

    if (path === "/api/documents" && request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO contracts (
          id,
          client_id,
          template_id,
          created_by,
          status,
          body,
          client_signature,
          treeguy_signature,
          client_agreed,
          created_at
        )
        VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        body.client_id || null,
        body.template_id || null,
        body.created_by || null,
        JSON.stringify(body.body || {}),
        body.body?.client_signature || null,
        body.body?.treeguy_signature || null,
        body.body?.client_agreed ? 1 : 0
      ).run();

      if (Array.isArray(body.photos)) {
        for (const p of body.photos) {
          await DB.prepare(`
            INSERT INTO contract_photos (id, contract_id, url, name, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
          `).bind(
            p.id,
            id,
            p.url,
            p.name || null
          ).run();
        }
      }

      return Response.json({ success: true, id });
    }

    // ============================
    // LEGACY CONTRACTS
    // ============================
    if (path === "/api/contracts" && request.method === "GET") {
      const { results } = await DB.prepare(`
        SELECT * FROM contracts ORDER BY created_at DESC
      `).all();
      return Response.json(results || []);
    }

    if (path === "/api/contracts" && request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO contracts (
          id,
          client_id,
          template_id,
          created_by,
          status,
          body,
          created_at
        )
        VALUES (?, ?, ?, ?, 'draft', ?, datetime('now'))
      `).bind(
        id,
        body.client_id || null,
        body.template_id || null,
        body.created_by || null,
        JSON.stringify(body.body || {})
      ).run();

      return Response.json({ success: true, id });
    }

    // ============================
    // UPDATE CONTRACT
    // ============================
    if (path.startsWith("/api/contracts/") && request.method === "PATCH") {
      const contractId = path.split("/").pop();
      const body = await request.json();

      await DB.prepare(`
        UPDATE contracts
        SET body = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        JSON.stringify(body.body || {}),
        body.status || "draft",
        contractId
      ).run();

      return Response.json({ success: true });
    }

    // ============================
    // SIGN CONTRACT
    // ============================
    if (path.startsWith("/api/contracts/sign/") && request.method === "POST") {
      const contractId = path.split("/").pop();
      const body = await request.json();

      await DB.prepare(`
        UPDATE contracts
        SET status = 'signed',
            client_signature = ?,
            treeguy_signature = ?,
            client_agreed = ?,
            signed_at = datetime('now')
        WHERE id = ?
      `).bind(
        body.client_signature || null,
        body.treeguy_signature || null,
        body.client_agreed ? 1 : 0,
        contractId
      ).run();

      return Response.json({ success: true });
    }

    // ============================
    // FALLBACK
    // ============================
    return new Response("Route not found", { status: 404 });
  }
};
