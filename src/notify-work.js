// ============================================================
// REAL TREE GUY OS — GLOBAL NOTIFICATION WORKER
// ============================================================

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  // ============================================================
  // OPTIONS (CORS)
  // ============================================================
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
      }
    });
  }

  // ============================================================
  // CREATE NOTIFICATION
  // ============================================================
  if (path === "/api/notify/create" && request.method === "POST") {
    const body = await request.json();

    const id = crypto.randomUUID();
    const ts = Date.now();

    await DB.prepare(`
      INSERT INTO notifications (id, user_id, scope, type, title, message, data, created_at, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(
      id,
      body.user_id || null,
      body.scope || "global",      // "global", "user", "channel", "job", etc.
      body.type || "info",         // "info", "warning", "danger", "success"
      body.title || "",
      body.message || "",
      JSON.stringify(body.data || {}),
      ts
    ).run();

    return json({ ok: true, id, created_at: ts });
  }

  // ============================================================
  // LIST NOTIFICATIONS (FOR USER)
  // ============================================================
  if (path === "/api/notify/list" && request.method === "GET") {
    const user_id = url.searchParams.get("user_id");

    const rows = await DB.prepare(`
      SELECT id, scope, type, title, message, data, created_at, read
      FROM notifications
      WHERE (user_id = ? OR scope = 'global')
      ORDER BY created_at DESC
      LIMIT 200
    `).bind(user_id).all();

    const results = (rows.results || []).map(n => ({
      id: n.id,
      scope: n.scope,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data ? JSON.parse(n.data) : {},
      created_at: n.created_at,
      read: !!n.read
    }));

    return json(results);
  }

  // ============================================================
  // MARK NOTIFICATION READ
  // ============================================================
  if (path === "/api/notify/read" && request.method === "POST") {
    const body = await request.json();

    await DB.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE id = ?
    `).bind(body.id).run();

    return json({ ok: true });
  }

  // ============================================================
  // CLEAR ALL NOTIFICATIONS FOR USER
  // ============================================================
  if (path === "/api/notify/clear" && request.method === "POST") {
    const body = await request.json();

    await DB.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE user_id = ? OR scope = 'global'
    `).bind(body.user_id).run();

    return json({ ok: true });
  }

  // ============================================================
  // WEBSOCKET STREAM (LIVE NOTIFICATIONS)
  // ============================================================
  if (path === "/api/notify/stream" &&
      request.headers.get("Upgrade") === "websocket") {

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    server.addEventListener("message", async event => {
      try {
        const msg = JSON.parse(event.data);

        // Expect: { type: "subscribe", user_id: "..." }
        if (msg.type === "subscribe" && msg.user_id) {
          // You can expand this later to push live events.
          server.send(JSON.stringify({
            type: "subscribed",
            user_id: msg.user_id
          }));
        }
      } catch {}
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return json({ error: "Notify route not found" }, 404);
}
