// ============================================================
// REAL TREE GUY OS — RADIO WORKER (CHANNEL + PROXIMITY VERSION)
// ============================================================

function cors(json, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-RTG-User"
    }
  });
}

export async function handle(request, env) {
  const DB = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;

  // ============================================================
  // OPTIONS
  // ============================================================
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-RTG-User"
      }
    });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  // ============================================================
  // DISTANCE (feet)
// ============================================================
  function distanceFt(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meters
    const toRad = x => (x * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = R * c;
    return meters * 3.28084; // ft
  }

  // ============================================================
  // GET CHANNEL LIST
  // ============================================================
  if (path === "/api/radio/channels" && request.method === "GET") {
    const rows = await DB.prepare(`
      SELECT id, name, created_by, created_at
      FROM channels
      ORDER BY created_at DESC
    `).all();

    for (const ch of rows.results) {
      const members = await DB.prepare(`
        SELECT COUNT(*) AS count
        FROM channel_members
        WHERE channel_id = ? AND active = 1
      `).bind(ch.id).first();

      ch.members = members.count;
    }

    return json(rows.results);
  }

  // ============================================================
  // CREATE CHANNEL
  // ============================================================
  if (path === "/api/radio/channel" && request.method === "POST") {
    const body = await request.json();
    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO channels (id, name, created_by, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(id, body.name, body.created_by, Date.now()).run();

    return json({ id, name: body.name });
  }

  // ============================================================
  // JOIN CHANNEL (proximity required)
  // ============================================================
  if (path === "/api/radio/join" && request.method === "POST") {
    const body = await request.json();
    const { channel_id, user_id, lat, lon } = body;

    const countRow = await DB.prepare(`
      SELECT COUNT(*) AS count
      FROM channel_members
      WHERE channel_id = ? AND active = 1
    `).bind(channel_id).first();

    if (countRow.count >= 20) {
      return json({ error: "Channel full (20 max)" }, 400);
    }

    const members = await DB.prepare(`
      SELECT user_id, last_lat, last_lon
      FROM channel_members
      WHERE channel_id = ? AND active = 1
    `).bind(channel_id).all();

    let inRange = false;

    for (const m of members.results) {
      if (m.last_lat && m.last_lon) {
        const ft = distanceFt(lat, lon, m.last_lat, m.last_lon);
        if (ft <= 1000) {
          inRange = true;
          break;
        }
      }
    }

    if (!inRange && members.results.length > 0) {
      return json({ error: "Must be within 1000 ft of a member to join" }, 400);
    }

    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO channel_members (id, channel_id, user_id, joined_at, active, locked, last_lat, last_lon, last_seen)
      VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?)
    `).bind(id, channel_id, user_id, Date.now(), lat, lon, Date.now()).run();

    return json({ ok: true, id });
  }

  // ============================================================
  // LEAVE CHANNEL
  // ============================================================
  if (path === "/api/radio/leave" && request.method === "POST") {
    const body = await request.json();

    await DB.prepare(`
      UPDATE channel_members
      SET active = 0
      WHERE channel_id = ? AND user_id = ?
    `).bind(body.channel_id, body.user_id).run();

    return json({ ok: true });
  }

  // ============================================================
  // PRESENCE (members + nearby)
// ============================================================
  if (path === "/api/radio/presence" && request.method === "GET") {
    const channel_id = url.searchParams.get("channel_id");
    const lat = parseFloat(url.searchParams.get("lat"));
    const lon = parseFloat(url.searchParams.get("lon"));

    const members = await DB.prepare(`
      SELECT cm.user_id, cm.last_lat, cm.last_lon, cm.last_seen, u.name
      FROM channel_members cm
      LEFT JOIN users u ON u.id = cm.user_id
      WHERE cm.channel_id = ? AND cm.active = 1
    `).bind(channel_id).all();

    const memberList = members.results.map(m => ({
      user_id: m.user_id,
      name: m.name || "Tree Guy",
      distance_ft: m.last_lat ? Math.round(distanceFt(lat, lon, m.last_lat, m.last_lon)) : null,
      online: Date.now() - m.last_seen < 15000
    }));

    const nearby = await DB.prepare(`
      SELECT id, name, lat, lng
      FROM users
      WHERE id NOT IN (
        SELECT user_id FROM channel_members WHERE channel_id = ? AND active = 1
      )
    `).bind(channel_id).all();

    const nearbyList = nearby.results
      .map(u => ({
        user_id: u.id,
        name: u.name || "Tree Guy",
        distance_ft: u.lat ? Math.round(distanceFt(lat, lon, u.lat, u.lng)) : null
      }))
      .filter(u => u.distance_ft !== null && u.distance_ft <= 1000);

    return json({
      channel_id,
      members: memberList,
      in_range_candidates: nearbyList
    });
  }

  // ============================================================
  // WEBSOCKET SIGNAL
  // ============================================================
  if (path === "/api/radio/signal" &&
      request.headers.get("Upgrade") === "websocket") {

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    server.addEventListener("message", event => {
      try {
        const msg = JSON.parse(event.data);
        server.send(JSON.stringify(msg));
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
  return json({ error: "Radio route not found" }, 404);
}
