// ============================================================
// REAL TREE GUY — RADIO WORKER
// Signaling + Presence for Jobsite Radio
// ============================================================

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/radio/connect" && request.method === "POST") {
    const body = await request.json();
    const id = body.id;
    const name = body.name;
    const channel = body.channel || "1";

    const wsUrl = `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}/api/radio/signal?channel=${encodeURIComponent(channel)}&id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;

    return Response.json({ wsUrl });
  }

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

      // In a full implementation, you'd use Durable Objects to track
      // all peers per channel and broadcast messages to them.
      // For now, we just echo back for local testing.
      server.send(JSON.stringify(msg));
    });

    server.addEventListener("close", () => {
      // Cleanup if using Durable Objects or D1
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  return new Response("Radio route not found", { status: 404 });
}
