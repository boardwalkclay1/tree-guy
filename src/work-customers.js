// ============================================================
// REAL TREE GUY OS — CUSTOMERS & JOBS WORKER (D1)
// ============================================================

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const DB = env.DB;

  // -----------------------------
  // CUSTOMERS: GET ALL
  // -----------------------------
  if (path === "/api/customers" && request.method === "GET") {
    const rows = await DB.prepare("SELECT * FROM customers ORDER BY created_at DESC").all();
    return Response.json(rows.results || []);
  }

  // -----------------------------
  // CUSTOMERS: ADD
  // -----------------------------
  if (path === "/api/customers" && request.method === "POST") {
    const body = await request.json();

    await DB.prepare(
      `INSERT INTO customers (id, name, phone, email, address, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.id,
        body.name,
        body.phone || "",
        body.email || "",
        body.address || "",
        body.notes || "",
        Date.now()
      )
      .run();

    return Response.json({ ok: true });
  }

  // -----------------------------
  // CUSTOMERS: DELETE
  // -----------------------------
  if (path === "/api/customers" && request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    await DB.prepare("DELETE FROM customers WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  }

  // -----------------------------
  // JOBS: GET ALL
  // -----------------------------
  if (path === "/api/jobs" && request.method === "GET") {
    const rows = await DB.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
    return Response.json(rows.results || []);
  }

  // -----------------------------
  // JOBS: ADD
  // -----------------------------
  if (path === "/api/jobs" && request.method === "POST") {
    const body = await request.json();

    await DB.prepare(
      `INSERT INTO jobs (id, customer_id, title, date, price, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        body.id,
        body.customer || null,
        body.title,
        body.date || "",
        body.price || "",
        body.status || "potential",
        body.notes || "",
        Date.now()
      )
      .run();

    return Response.json({ ok: true });
  }

  // -----------------------------
  // JOBS: DELETE
  // -----------------------------
  if (path === "/api/jobs" && request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    await DB.prepare("DELETE FROM jobs WHERE id = ?").bind(id).run();
    return Response.json({ ok: true });
  }

  // -----------------------------
  // FALLBACK
  // -----------------------------
  return Response.json({ error: "Route not found" }, { status: 404 });
}
