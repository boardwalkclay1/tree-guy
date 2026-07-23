// ============================================================
// REAL TREE GUY — RTG ONLINE RADIO WORKER (ADVANCED)
// Multi-channel • Squads • Friends • Presence • PTT • Heartbeat
// Connects to main RTG Online Worker via env.RTG_ONLINE
// ============================================================

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // CORS
    // ============================================================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    // ============================================================
    // PRESENCE (Tree Guy Online)
    // ============================================================
    if (path === "/api/rtg-online/radio/presence" && request.method === "POST") {
      const body = await request.json();
      const ts = Date.now();

      try {
        await env.DB.prepare(
          `INSERT INTO radio_presence (id, name, channel, squad, ts)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(
          body.id || null,
          body.name || null,
          body.channel || "1",
          body.squad || null,
          ts
        )
        .run();

        // Notify main RTG Online Worker
        await env.RTG_ONLINE.fetch(env.RTG_ONLINE_URL + "/presence-update", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" }
        });

        return json({ ok: true });
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    // ============================================================
    // CONNECT → returns WebSocket URL
    // ============================================================
    if (path === "/api/rtg-online/radio/connect" && request.method === "POST") {
      const body = await request.json();

      const id = body.id || `tg-${crypto.randomUUID()}`;
      const name = body.name || "Operator";
      const channel = body.channel || "1";
      const squad = body.squad || null;

      const wsUrl =
        `wss://api.realtreeguy.com/api/rtg-online/radio/signal` +
        `?id=${encodeURIComponent(id)}` +
        `&name=${encodeURIComponent(name)}` +
        `&channel=${encodeURIComponent(channel)}` +
        `&squad=${encodeURIComponent(squad || "")}`;

      return json({ wsUrl });
    }

    // ============================================================
    // SIGNAL (WebSocket)
    // ============================================================
    if (path === "/api/rtg-online/radio/signal" &&
        request.headers.get("Upgrade") === "websocket") {

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      const params = url.searchParams;
      const id = params.get("id") || `tg-${crypto.randomUUID()}`;
      const name = params.get("name") || "Operator";
      const channel = params.get("channel") || "1";
      const squad = params.get("squad") || null;

      server.accept();

      // ============================================================
      // BROADCAST SYSTEM
      // ============================================================
      async function broadcast(msg) {
        // Fanout to main RTG Online Worker
        await env.RTG_ONLINE.fetch(env.RTG_ONLINE_URL + "/radio-broadcast", {
          method: "POST",
          body: JSON.stringify(msg),
          headers: { "Content-Type": "application/json" }
        });
      }

      // ============================================================
      // MESSAGE HANDLER
      // ============================================================
      server.addEventListener("message", async event => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        msg.id = msg.id || id;
        msg.name = msg.name || name;
        msg.channel = msg.channel || channel;
        msg.squad = msg.squad || squad;
        msg.ts = Date.now();

        // Save heartbeat / presence
        if (msg.type === "heartbeat") {
          await env.DB.prepare(
            `UPDATE radio_presence SET ts = ? WHERE id = ?`
          )
          .bind(msg.ts, msg.id)
          .run();
        }

        // Save channel change
        if (msg.type === "channel-change") {
          await env.DB.prepare(
            `UPDATE radio_presence SET channel = ? WHERE id = ?`
          )
          .bind(msg.channel, msg.id)
          .run();
        }

        // Save squad change
        if (msg.type === "squad-change") {
          await env.DB.prepare(
            `UPDATE radio_presence SET squad = ? WHERE id = ?`
          )
          .bind(msg.squad, msg.id)
          .run();
        }

        // Broadcast to main RTG Online Worker
        await broadcast(msg);

        // Echo back to client
        server.send(JSON.stringify(msg));
      });

      server.addEventListener("close", async () => {
        await broadcast({
          type: "leave",
          id,
          name,
          channel,
          squad,
          ts: Date.now()
        });
      });

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // ============================================================
    // FALLBACK
    // ============================================================
    return json({ error: "RTG Online Radio route not found" }, 404);
  }
};
