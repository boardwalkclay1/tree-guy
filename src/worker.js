export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const DB = env.DB;

    // ============================================================
    // SAFE MODE — NO AUTH, NO LOCKOUT
    // ============================================================
    const userId = "owner1";

    // ============================================================
    // ROUTER
    // ============================================================
    if (path === "/api/health") {
      return Response.json({ ok: true, time: Date.now() });
    }

    // ============================================================
    // GET ALL JOBS
    // ============================================================
    if (path === "/api/jobs" && request.method === "GET") {
      const { results } = await DB.prepare(
        "SELECT * FROM jobs WHERE client_id = ? ORDER BY created_at DESC"
      ).bind(userId).all();

      return Response.json(results);
    }

    // ============================================================
    // GET ONE JOB
    // ============================================================
    if (path.startsWith("/api/jobs/") && request.method === "GET") {
      const jobId = path.split("/").pop();

      const { results } = await DB.prepare(
        "SELECT * FROM jobs WHERE id = ?"
      ).bind(jobId).all();

      return Response.json(results[0] || {});
    }

    // ============================================================
    // CREATE JOB
    // ============================================================
    if (path === "/api/jobs" && request.method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO jobs (
          id,
          client_id,
          title,
          description,
          status,
          location_city,
          location_state,
          location_zip,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        id,
        userId,
        body.title,
        body.description,
        "open",
        body.city,
        body.state,
        body.zip
      ).run();

      return Response.json({ success: true, id });
    }

    // ============================================================
    // UPDATE JOB STATUS
    // ============================================================
    if (path.startsWith("/api/jobs/") && request.method === "PATCH") {
      const jobId = path.split("/").pop();
      const body = await request.json();

      await DB.prepare(`
        UPDATE jobs
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(body.status, jobId).run();

      return Response.json({ success: true });
    }

    // ============================================================
    // DASHBOARD — TODAY'S JOB
    // ============================================================
    if (path === "/api/dashboard/today") {
      const { results } = await DB.prepare(
        "SELECT * FROM jobs WHERE client_id = ? ORDER BY created_at DESC LIMIT 1"
      ).bind(userId).all();

      return Response.json(results[0] || {});
    }

    // ============================================================
    // PROFILE
    // ============================================================
    if (path === "/api/profile") {
      const { results } = await DB.prepare(
        "SELECT * FROM tree_profile WHERE user_id = ?"
      ).bind(userId).all();

      return Response.json(results[0] || {});
    }

    // ============================================================
    // CUSTOMERS (COMING SOON)
    // ============================================================
    if (path === "/api/customers" && request.method === "GET") {
      const { results } = await DB.prepare(
        "SELECT * FROM client_profile ORDER BY name ASC"
      ).all();

      return Response.json(results);
    }

    // ============================================================
    // NOT FOUND
    // ============================================================
    return new Response("Not found", { status: 404 });
  }
};
