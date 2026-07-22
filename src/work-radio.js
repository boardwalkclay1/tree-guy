// ============================================================
// REAL TREE GUY — RADIO WORKER (FIXED)
// ============================================================

function cors(json, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
    }
  });
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // ============================================================
  // OPTIONS (CORS preflight)
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
  // RADIO PRESENCE
  // ============================================================
  if (path === "/api/radio/presence" && request.method === "POST") {
    try {
      const body = await request.json();

      if (env.DB) {
        await env.DB.prepare(
          "INSERT INTO radio_presence (user_id, email, type, ts) VALUES (?, ?, ?, ?)"
        )
          .bind(body.user_id || null, body.email || null, body.type || null, Date.now())
          .run();
      }

      return cors({ ok: true });
    } catch (err) {
      return cors({ error: err.message }, 500);
    }
  }

  // ============================================================
  // RADIO CONNECT → returns WebSocket URL
  // ============================================================
  if (path === "/api/radio/connect" && request.method === "POST") {
    const body = await request.json();

    const id = body.id || `peer-${crypto.randomUUID()}`;
    const name = body.name || "Operator";
    const channel = body.channel || "1";

    const wsUrl =
      `wss://api.realtreeguy.com/api/radio/signal` +
      `?channel=${encodeURIComponent(channel)}` +
      `&id=${encodeURIComponent(id)}` +
      `&name=${encodeURIComponent(name)}`;

    return cors({ wsUrl });
  }

  // ============================================================
  // RADIO SIGNAL (WebSocket)
  // ============================================================
  if (path === "/api/radio/signal" &&
      request.headers.get("Upgrade") === "websocket") {

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const params = url.searchParams;
    const channel = params.get("channel") || "1";
    const id = params.get("id") || `peer-${crypto.randomUUID()}`;
    const name = params.get("name") || "Operator";

    server.accept();

    server.addEventListener("message", event => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      msg.channel = msg.channel || channel;
      msg.id = msg.id || id;
      msg.name = msg.name || name;

      server.send(JSON.stringify(msg));
    });

    server.addEventListener("close", () => {});

    // IMPORTANT: DO NOT ADD HEADERS HERE
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  // ============================================================
  // FALLBACK
  // ============================================================
  return cors({ error: "Radio route not found" }, 404);
}
