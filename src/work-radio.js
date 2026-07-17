// ============================================================
// REAL TREE GUY — RADIO WORKER
// Signaling + Presence for Jobsite Radio
// ============================================================

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // ------------------------------------------------------------
  // RADIO PRESENCE (Dashboard heartbeat)
// ------------------------------------------------------------
  if (path === "/api/radio/presence" && request.method === "POST") {
    try {
      const body = await request.json();

      // Optional D1 logging (safe if table exists)
      if (env.DB) {
        await env.DB.prepare(
          "INSERT INTO radio_presence (user_id, email, type, ts) VALUES (?, ?, ?, ?)"
        )
          .bind(body.user_id || null, body.email || null, body.type || null, Date.now())
          .run();
      }

      return Response.json({ ok: true });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // ------------------------------------------------------------
  // RADIO CONNECT → returns WebSocket URL
  // ------------------------------------------------------------
  if (path === "/api/radio/connect" && request.method === "POST") {
    const body = await request.json();
    const id = body.id || `peer-${crypto.randomUUID()}`;
    const name = body.name || "Operator";
    const channel = body.channel || "1";

    const wsUrl =
      `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}` +
      `/api/radio/signal?channel=${encodeURIComponent(channel)}` +
      `&id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;

    return Response.json({ wsUrl });
  }

  // ------------------------------------------------------------
  // RADIO SIGNAL (WebSocket echo for now)
// ------------------------------------------------------------
  if (path === "/api/radio/signal" && request.headers.get("Upgrade") === "websocket") {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const urlParams = url.searchParams;
    const channel = urlParams.get("channel") || "1";
    const id = urlParams.get("id") || `peer-${crypto.randomUUID()}`;
    const name = urlParams.get("name") || "Operator";

    server.accept();

    server.addEventListener("message", async (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      msg.channel = msg.channel || channel;
      msg.id = msg.id || id;
      msg.name = msg.name || name;

      // Echo back for now (Durable Objects later)
      server.send(JSON.stringify(msg));
    });

    server.addEventListener("close", () => {
      // Optional cleanup if you add DO/D1 tracking
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  // ------------------------------------------------------------
  // FALLBACK
  // ------------------------------------------------------------
  return new Response("Radio route not found", { status: 404 });
}
