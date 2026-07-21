export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  // ============================================================
  // GET CATEGORIES (clients, lumberjacks, squads)
  // ============================================================
  if (path === "/rtg/api/messages/categories" && request.method === "GET") {
    const userId = url.searchParams.get("user");

    const clients = await DB.prepare(`
      SELECT id, name, avatar_url
      FROM users
      WHERE type = 'client'
      ORDER BY name ASC
    `).all();

    const lumberjacks = await DB.prepare(`
      SELECT l.lumberjack_id AS id, u.name, u.avatar_url
      FROM lumberjacks l
      LEFT JOIN users u ON u.id = l.lumberjack_id
      WHERE l.treeguy_id = ?
      ORDER BY u.name ASC
    `).bind(userId).all();

    const squads = await DB.prepare(`
      SELECT id, name
      FROM squads
      WHERE created_by = ?
      ORDER BY created_at DESC
    `).bind(userId).all();

    return json({
      clients: clients.results,
      lumberjacks: lumberjacks.results,
      squads: squads.results
    });
  }

  // ============================================================
  // GET ALL THREADS FOR USER
  // ============================================================
  if (path === "/rtg/api/messages/threads" && request.method === "GET") {
    const userId = url.searchParams.get("user");

    const threads = await DB.prepare(`
      SELECT DISTINCT thread_id
      FROM messages
      WHERE from_user_id = ? OR to_user_id = ?
      ORDER BY created_at DESC
    `).bind(userId, userId).all();

    return json(threads.results);
  }

  // ============================================================
  // GET ALL MESSAGES FOR USER
  // ============================================================
  if (path === "/rtg/api/messages/all" && request.method === "GET") {
    const userId = url.searchParams.get("user");

    const messages = await DB.prepare(`
      SELECT *
      FROM messages
      WHERE from_user_id = ? OR to_user_id = ?
      ORDER BY created_at DESC
    `).bind(userId, userId).all();

    return json(messages.results);
  }

  // ============================================================
  // OPEN DIRECT THREAD
  // ============================================================
  if (path === "/rtg/api/messages/thread" && request.method === "GET") {
    const userId = url.searchParams.get("user");
    const otherId = url.searchParams.get("other");

    // Create thread ID deterministically
    const threadId = [userId, otherId].sort().join("_");

    const messages = await DB.prepare(`
      SELECT *
      FROM messages
      WHERE thread_id = ?
      ORDER BY created_at ASC
    `).bind(threadId).all();

    const otherUser = await DB.prepare(`
      SELECT id, name, avatar_url
      FROM users
      WHERE id = ?
    `).bind(otherId).first();

    return json({
      id: threadId,
      title: otherUser?.name || "Conversation",
      otherUserId: otherId,
      messages: messages.results
    });
  }

  // ============================================================
  // OPEN SQUAD THREAD
  // ============================================================
  if (path === "/rtg/api/messages/squad" && request.method === "GET") {
    const squadId = url.searchParams.get("squad");

    const messages = await DB.prepare(`
      SELECT *
      FROM messages
      WHERE squad_id = ?
      ORDER BY created_at ASC
    `).bind(squadId).all();

    const squad = await DB.prepare(`
      SELECT id, name
      FROM squads
      WHERE id = ?
    `).bind(squadId).first();

    return json({
      id: squadId,
      title: squad?.name || "LumberSquad",
      squadId,
      messages: messages.results
    });
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================
  if (path === "/rtg/api/messages/send" && request.method === "POST") {
    const body = await request.json();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await DB.prepare(`
      INSERT INTO messages (
        id, from_user_id, to_user_id, squad_id,
        thread_id, reply_to, body, media_url, media_type,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.user_id,
      body.to_user_id || null,
      body.squad_id || null,
      body.thread_id || null,
      body.reply_to || null,
      body.body,
      body.media_url || null,
      body.media_type || null,
      now
    ).run();

    return json({ ok: true, id });
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return json({ error: "Message route not found" }, 404);
}
