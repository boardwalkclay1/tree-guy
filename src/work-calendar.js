export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const DB = env.DB;

  // ============================
  // GET ALL EVENTS
  // ============================
  if (path === "/api/calendar" && request.method === "GET") {
    const { results } = await DB.prepare(
      "SELECT * FROM calendar ORDER BY start_time ASC"
    ).all();
    return Response.json(results || []);
  }

  // ============================
  // CREATE EVENT
  // ============================
  if (path === "/api/calendar" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO calendar (
        id, title, notes, start_time, end_time, client_id, crew_id, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      body.title,
      body.notes,
      body.start_time,
      body.end_time,
      body.client_id || null,
      body.crew_id || null
    ).run();

    return Response.json({ success: true, id });
  }

  // ============================
  // UPDATE EVENT
  // ============================
  if (path.startsWith("/api/calendar/") && request.method === "PATCH") {
    const eventId = path.split("/").pop();
    const body = await request.json();

    await DB.prepare(`
      UPDATE calendar
      SET title = ?, notes = ?, start_time = ?, end_time = ?, client_id = ?, crew_id = ?
      WHERE id = ?
    `).bind(
      body.title,
      body.notes,
      body.start_time,
      body.end_time,
      body.client_id,
      body.crew_id,
      eventId
    ).run();

    return Response.json({ success: true });
  }

  // ============================
  // DELETE EVENT
  // ============================
  if (path.startsWith("/api/calendar/") && request.method === "DELETE") {
    const eventId = path.split("/").pop();

    await DB.prepare("DELETE FROM calendar WHERE id = ?")
      .bind(eventId)
      .run();

    return Response.json({ success: true });
  }

  return new Response("Calendar route not found", { status: 404 });
}
