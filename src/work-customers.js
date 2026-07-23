// ============================================================
// REAL TREE GUY OS — CUSTOMERS & JOBS WORKER (D1, FINAL VERSION)
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  // ----------------------------------------------------------
  // CORS
  // ----------------------------------------------------------
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // Helper: JSON response
  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }

  // ============================================================
  // CUSTOMERS
  // ============================================================

  // GET ALL CUSTOMERS
  if (path === "/api/customers" && request.method === "GET") {
    try {
      const rows = await DB.prepare(`
        SELECT * FROM customers ORDER BY created_at DESC
      `).all();

      return json(rows.results || []);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // GET ONE CUSTOMER
  if (path.startsWith("/api/customers/") && request.method === "GET") {
    const id = path.split("/").pop();
    try {
      const row = await DB.prepare(`
        SELECT * FROM customers WHERE id = ?
      `).bind(id).first();

      return json(row || {});
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ADD CUSTOMER
  if (path === "/api/customers" && request.method === "POST") {
    try {
      const body = await request.json();
      const id = body.id || crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO customers (id, name, phone, email, address, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          body.name,
          body.phone || "",
          body.email || "",
          body.address || "",
          body.notes || "",
          Date.now(),
          Date.now()
        )
        .run();

      return json({ id, ...body });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // UPDATE CUSTOMER
  if (path.startsWith("/api/customers/") && request.method === "PATCH") {
    const id = path.split("/").pop();
    try {
      const body = await request.json();

      await DB.prepare(`
        UPDATE customers
        SET name = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `)
        .bind(
          body.name,
          body.phone,
          body.email,
          body.address,
          body.notes,
          Date.now(),
          id
        )
        .run();

      return json({ ok: true });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // DELETE CUSTOMER
  if (path === "/api/customers" && request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);

    try {
      await DB.prepare(`DELETE FROM customers WHERE id = ?`).bind(id).run();
      return json({ ok: true });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ============================================================
  // JOBS
  // ============================================================

  // GET ALL JOBS
  if (path === "/api/jobs" && request.method === "GET") {
    try {
      const rows = await DB.prepare(`
        SELECT * FROM jobs ORDER BY created_at DESC
      `).all();

      return json(rows.results || []);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // GET ONE JOB
  if (path.startsWith("/api/jobs/") && request.method === "GET") {
    const id = path.split("/").pop();
    try {
      const row = await DB.prepare(`
        SELECT * FROM jobs WHERE id = ?
      `).bind(id).first();

      return json(row || {});
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ADD JOB
  if (path === "/api/jobs" && request.method === "POST") {
    try {
      const body = await request.json();
      const id = body.id || crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO jobs (id, customer_id, title, date, price, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          body.customer || null,
          body.title,
          body.date || "",
          body.price || "",
          body.status || "potential",
          body.notes || "",
          Date.now(),
          Date.now()
        )
        .run();

      return json({ id, ...body });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // UPDATE JOB
  if (path.startsWith("/api/jobs/") && request.method === "PATCH") {
    const id = path.split("/").pop();
    try {
      const body = await request.json();

      await DB.prepare(`
        UPDATE jobs
        SET customer_id = ?, title = ?, date = ?, price = ?, status = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `)
        .bind(
          body.customer,
          body.title,
          body.date,
          body.price,
          body.status,
          body.notes,
          Date.now(),
          id
        )
        .run();

      return json({ ok: true });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // DELETE JOB
  if (path === "/api/jobs" && request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);

    try {
      await DB.prepare(`DELETE FROM jobs WHERE id = ?`).bind(id).run();
      return json({ ok: true });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }

  // ----------------------------------------------------------
  // FALLBACK
  // ----------------------------------------------------------
  return json({ error: "Route not found" }, 404);
}
