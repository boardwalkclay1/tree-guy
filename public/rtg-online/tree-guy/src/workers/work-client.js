export default {
  async fetch(request, env) {
    const DB = env.DB;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
      });

    // Extract client ID from header (or session token later)
    const clientId = request.headers.get("x-client-id");

    // ============================================================
    // CLIENT LOGIN
    // ============================================================
    if (path === "/client/login" && method === "POST") {
      const body = await request.json();
      const user = await DB.prepare(`
        SELECT * FROM client_users WHERE email = ?
      `).bind(body.email).first();

      if (!user) return json({ error: "User not found" }, 404);

      return json({ ok: true, user });
    }

    // ============================================================
    // CLIENT REGISTER
    // ============================================================
    if (path === "/client/register" && method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO client_users (id, name, email, phone, address, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, body.name, body.email, body.phone, body.address, Date.now()).run();

      return json({ ok: true, id });
    }

    // ============================================================
    // GET CLIENT PROFILE
    // ============================================================
    if (path === "/client/me" && method === "GET") {
      const user = await DB.prepare(`
        SELECT * FROM client_users WHERE id = ?
      `).bind(clientId).first();

      return json(user || {});
    }

    // ============================================================
    // POST JOB
    // ============================================================
    if (path === "/client/job" && method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO client_jobs
        (id, client_id, title, description, photos, budget, flexible_budget,
         best_days, best_time, address, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?)
      `).bind(
        id,
        clientId,
        body.title,
        body.description,
        JSON.stringify(body.photos || []),
        body.budget,
        body.flexible_budget ? 1 : 0,
        JSON.stringify(body.best_days || []),
        body.best_time,
        body.address,
        Date.now()
      ).run();

      return json({ ok: true, id });
    }

    // ============================================================
    // GET ALL JOBS FOR CLIENT
    // ============================================================
    if (path === "/client/jobs" && method === "GET") {
      const rows = await DB.prepare(`
        SELECT * FROM client_jobs WHERE client_id = ?
        ORDER BY created_at DESC
      `).bind(clientId).all();

      return json(rows.results || []);
    }

    // ============================================================
    // GET SINGLE JOB
    // ============================================================
    if (path.startsWith("/client/job/") && method === "GET") {
      const jobId = path.split("/").pop();

      const job = await DB.prepare(`
        SELECT * FROM client_jobs WHERE id = ?
      `).bind(jobId).first();

      return json(job || {});
    }

    // ============================================================
    // SEND MESSAGE (client ↔ tree guy)
    // ============================================================
    if (path.startsWith("/client/job/") && path.endsWith("/message") && method === "POST") {
      const jobId = path.split("/")[3];
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO job_messages (id, job_id, from_user, to_user, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        jobId,
        clientId,
        body.to_user,
        body.message,
        Date.now()
      ).run();

      return json({ ok: true, id });
    }

    // ============================================================
    // GET MESSAGES FOR JOB
    // ============================================================
    if (path.startsWith("/client/job/") && path.endsWith("/messages") && method === "GET") {
      const jobId = path.split("/")[3];

      const rows = await DB.prepare(`
        SELECT * FROM job_messages WHERE job_id = ?
        ORDER BY created_at ASC
      `).bind(jobId).all();

      return json(rows.results || []);
    }

    // ============================================================
    // TREE GUY ACCEPTS JOB
    // ============================================================
    if (path.startsWith("/client/job/") && path.endsWith("/accept") && method === "POST") {
      const jobId = path.split("/")[3];
      const body = await request.json();
      const id = crypto.randomUUID();

      await DB.prepare(`
        INSERT INTO job_acceptance (id, job_id, tree_guy_id, accepted_at)
        VALUES (?, ?, ?, ?)
      `).bind(id, jobId, body.tree_guy_id, Date.now()).run();

      await DB.prepare(`
        UPDATE client_jobs SET status = 'accepted' WHERE id = ?
      `).bind(jobId).run();

      return json({ ok: true });
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    if (path === "/client/notifications" && method === "GET") {
      const rows = await DB.prepare(`
        SELECT * FROM client_notifications WHERE user_id = ?
        ORDER BY created_at DESC
      `).bind(clientId).all();

      return json(rows.results || []);
    }

    return json({ error: "Route not found" }, 404);
  }
};
