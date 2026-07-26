// ============================================================
// RTG Online — Client Worker (Final Version)
// ============================================================

const PEPPER = "RTG_CLIENT_PEPPER_v1"; // internal-only
const enc = new TextEncoder();

// ============================================================
// PASSWORD HASH (PBKDF2 + static salt + pepper)
// ============================================================

async function hashPassword(password) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password + PEPPER),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: enc.encode("rtg-static-salt"),
      iterations: 150000
    },
    key,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

// ============================================================
// WORKER
// ============================================================

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

    const clientId = request.headers.get("x-client-id");

    // ============================================================
    // LOGIN (email + password)
    // ============================================================
    if (path === "/client/login" && method === "POST") {
      const body = await request.json();

      const user = await DB.prepare(`
        SELECT * FROM client_users WHERE email = ?
      `).bind(body.email).first();

      if (!user) return json({ error: "Invalid email or password" }, 401);

      const hash = await hashPassword(body.password);

      if (hash !== user.password_hash) {
        return json({ error: "Invalid email or password" }, 401);
      }

      return json({ ok: true, user });
    }

    // ============================================================
    // REGISTER (store hashed password)
    // ============================================================
    if (path === "/client/register" && method === "POST") {
      const body = await request.json();
      const id = crypto.randomUUID();

      const hash = await hashPassword(body.password);

      await DB.prepare(`
        INSERT INTO client_users (id, name, email, phone, address, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.name,
        body.email,
        body.phone,
        body.address,
        hash,
        Date.now()
      ).run();

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
    // UPDATE PROFILE (settings)
    // ============================================================
    if (path === "/client/settings/profile" && method === "POST") {
      const body = await request.json();

      await DB.prepare(`
        UPDATE client_users
        SET name = ?, email = ?, phone = ?, address = ?
        WHERE id = ?
      `).bind(
        body.name,
        body.email,
        body.phone,
        body.address,
        clientId
      ).run();

      return json({ ok: true });
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
    // SEND MESSAGE
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
    // GET MESSAGES
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
    // CONTRACTS
    // ============================================================
    if (path === "/client/contracts" && method === "GET") {
      const rows = await DB.prepare(`
        SELECT * FROM client_contracts WHERE client_id = ?
        ORDER BY created_at DESC
      `).bind(clientId).all();

      return json(rows.results || []);
    }

    // ============================================================
    // BILLING HISTORY
    // ============================================================
    if (path === "/client/billing" && method === "GET") {
      const rows = await DB.prepare(`
        SELECT * FROM client_billing WHERE client_id = ?
        ORDER BY created_at DESC
      `).bind(clientId).all();

      return json(rows.results || []);
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

    // ============================================================
    // ROUTE NOT FOUND
    // ============================================================
    return json({ error: "Route not found" }, 404);
  }
};
