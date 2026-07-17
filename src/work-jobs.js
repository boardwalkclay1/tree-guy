// ============================================================
// REAL TREE GUY OS — JOBS WORKER (D1)
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  // ------------------------------------------------------------
  // GET ALL JOBS
  // ------------------------------------------------------------
  if (path === "/api/jobs" && request.method === "GET") {
    try {
      const rows = await DB.prepare(
        "SELECT * FROM jobs ORDER BY created_at DESC"
      ).all();

      return Response.json(rows.results || []);
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // ------------------------------------------------------------
  // ADD JOB
  // ------------------------------------------------------------
  if (path === "/api/jobs" && request.method === "POST") {
    try {
      const body = await request.json();

      await DB.prepare(
        `INSERT INTO jobs (
          id,
          customer_id,
          title,
          date,
          price,
          status,
          notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
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
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // ------------------------------------------------------------
  // DELETE JOB
  // ------------------------------------------------------------
  if (path === "/api/jobs" && request.method === "DELETE") {
    try {
      const id = url.searchParams.get("id");
      if (!id) {
        return Response.json({ error: "Missing id" }, { status: 400 });
      }

      await DB.prepare("DELETE FROM jobs WHERE id = ?")
        .bind(id)
        .run();

      return Response.json({ ok: true });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // ------------------------------------------------------------
  // FALLBACK
  // ------------------------------------------------------------
  return Response.json({ error: "Jobs route not found" }, { status: 404 });
}
