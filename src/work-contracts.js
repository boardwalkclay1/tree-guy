export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const DB = env.DB;

  // ============================
  // GET ALL CONTRACTS
  // ============================
  if (path === "/api/contracts" && request.method === "GET") {
    const { results } = await DB.prepare(
      "SELECT * FROM contracts ORDER BY created_at DESC"
    ).all();
    return Response.json(results || []);
  }

  // ============================
  // CREATE CONTRACT
  // ============================
  if (path === "/api/contracts" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO contracts (
        id, client_id, job_id, terms, price, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, 'draft', datetime('now'))
    `).bind(
      id,
      body.client_id,
      body.job_id,
      body.terms,
      body.price
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
      SET terms = ?, price = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.terms,
      body.price,
      body.status,
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
      SET status = 'signed', signed_by = ?, signed_at = datetime('now')
      WHERE id = ?
    `).bind(body.signed_by, contractId).run();

    return Response.json({ success: true });
  }

  return new Response("Contracts route not found", { status: 404 });
}
