const COOKIE = "__Host-rtg_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function hex(bytes) {
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(length) {
  return hex(crypto.getRandomValues(new Uint8Array(length)));
}

async function digest(value) {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 210000
  }, key, 256);
  return hex(bits);
}

function equalHash(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return different === 0;
}

async function bodyJSON(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new InputError("Expected JSON");
  }
  const text = await request.text();
  if (text.length > 32768) throw new InputError("Request is too large");
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new InputError("Invalid JSON");
  }
}

class InputError extends Error {}

function text(value, name, max, required = false) {
  if (typeof value !== "string") {
    if (required || value != null) throw new InputError(`Invalid ${name}`);
    return "";
  }
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new InputError(`Invalid ${name}`);
  return result;
}

async function limit(db, key, max, duration) {
  const now = Date.now();
  const result = await db.prepare(`
    INSERT INTO portal_rate_limits (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
      reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END
    RETURNING count
  `).bind(key, now + duration, now, now).first();
  return result.count <= max;
}

async function createSession(db, userId) {
  const token = randomHex(32);
  await db.prepare("INSERT INTO portal_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await digest(token), userId, Date.now() + SESSION_SECONDS * 1000).run();
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

async function session(request, db) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})(?:;|$)`));
  if (!match) return null;
  return db.prepare(`
    SELECT u.id, u.name, u.email, u.role FROM portal_sessions s
    JOIN portal_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).bind(await digest(match[1]), Date.now()).first();
}

async function threadForUser(db, threadId, userId) {
  return db.prepare(`
    SELECT t.id, t.lead_id, t.tree_id, l.client_id, l.title
    FROM portal_threads t JOIN portal_leads l ON l.id = t.lead_id
    WHERE t.id = ? AND (t.tree_id = ? OR l.client_id = ?)
  `).bind(threadId, userId, userId).first();
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const db = env.DB;

  try {
    if (!["GET", "HEAD"].includes(request.method) &&
        request.headers.get("Origin") !== url.origin) {
      return json({ error: "Invalid request origin" }, 403);
    }

    if (path === "/api/portal/register" && request.method === "POST") {
      const body = await bodyJSON(request);
      const name = text(body.name, "name", 100, true);
      const email = text(body.email, "email", 254, true).toLowerCase();
      const role = body.role;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["tree", "client"].includes(role) ||
          typeof body.password !== "string" || body.password.length < 12 || body.password.length > 128) {
        throw new InputError("Enter a valid email and a password of 12–128 characters");
      }
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!await limit(db, `register:${await digest(ip)}`, 5, 600000)) {
        return json({ error: "Too many attempts. Try again later." }, 429);
      }
      if (await db.prepare("SELECT id FROM portal_users WHERE email = ?").bind(email).first()) {
        return json({ error: "An account with that email already exists" }, 409);
      }
      const id = crypto.randomUUID();
      const salt = randomHex(16);
      const hash = await passwordHash(body.password, salt);
      await db.prepare(`
        INSERT INTO portal_users (id, name, email, password_salt, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, name, email, salt, hash, role, new Date().toISOString()).run();
      const cookie = await createSession(db, id);
      return json({ user: { id, name, email, role } }, 201, { "Set-Cookie": cookie });
    }

    if (path === "/api/portal/login" && request.method === "POST") {
      const body = await bodyJSON(request);
      const email = text(body.email, "email", 254, true).toLowerCase();
      if (typeof body.password !== "string" || body.password.length > 128) throw new InputError("Invalid password");
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!await limit(db, `login-ip:${await digest(ip)}`, 20, 600000) ||
          !await limit(db, `login-email:${await digest(email)}`, 10, 600000)) {
        return json({ error: "Too many attempts. Try again later." }, 429);
      }
      const user = await db.prepare("SELECT * FROM portal_users WHERE email = ?").bind(email).first();
      const hash = await passwordHash(body.password, user?.password_salt || "00000000000000000000000000000000");
      if (!user || !equalHash(hash, user.password_hash)) return json({ error: "Invalid email or password" }, 401);
      const cookie = await createSession(db, user.id);
      return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 200, { "Set-Cookie": cookie });
    }

    const user = await session(request, db);
    if (!user) return json({ error: "Please sign in" }, 401);

    if (path === "/api/portal/me" && request.method === "GET") return json({ user });
    if (path === "/api/portal/logout" && request.method === "POST") {
      const match = (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})(?:;|$)`));
      await db.prepare("DELETE FROM portal_sessions WHERE token_hash = ?").bind(await digest(match[1])).run();
      return json({ ok: true }, 200, {
        "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
      });
    }

    if (user.role === "tree" || (path === "/api/portal/leads" && request.method === "POST")) {
      return json({
        error: user.role === "tree"
          ? "Tree professional access requires a $30 monthly subscription. Square payments are not configured yet."
          : "Posting a service request costs $10. Square payments are not configured yet."
      }, 503);
    }

    if (path === "/api/portal/contacts" && user.role === "tree") {
      if (request.method === "GET") {
        const rows = await db.prepare(`
          SELECT id, name, phone, email, address, notes, created_at FROM portal_contacts
          WHERE owner_id = ? ORDER BY created_at DESC LIMIT 500
        `).bind(user.id).all();
        return json({ contacts: rows.results });
      }
      if (request.method === "POST") {
        const body = await bodyJSON(request);
        const contact = {
          id: crypto.randomUUID(), name: text(body.name, "name", 100, true),
          phone: text(body.phone, "phone", 40), email: text(body.email, "email", 254),
          address: text(body.address, "address", 300), notes: text(body.notes, "notes", 2000)
        };
        await db.prepare(`
          INSERT INTO portal_contacts (id, owner_id, name, phone, email, address, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(contact.id, user.id, contact.name, contact.phone, contact.email, contact.address, contact.notes, new Date().toISOString()).run();
        return json({ contact }, 201);
      }
    }
    const contactMatch = path.match(/^\/api\/portal\/contacts\/([a-f0-9-]+)$/);
    if (contactMatch && user.role === "tree" && request.method === "PATCH") {
      const body = await bodyJSON(request);
      const result = await db.prepare(`
        UPDATE portal_contacts SET name = ?, phone = ?, email = ?, address = ?, notes = ?
        WHERE id = ? AND owner_id = ?
      `).bind(
        text(body.name, "name", 100, true), text(body.phone, "phone", 40),
        text(body.email, "email", 254), text(body.address, "address", 300),
        text(body.notes, "notes", 2000), contactMatch[1], user.id
      ).run();
      return result.meta.changes ? json({ ok: true }) : json({ error: "Contact not found" }, 404);
    }
    if (contactMatch && user.role === "tree" && request.method === "DELETE") {
      const result = await db.prepare("DELETE FROM portal_contacts WHERE id = ? AND owner_id = ?")
        .bind(contactMatch[1], user.id).run();
      return result.meta.changes ? json({ ok: true }) : json({ error: "Contact not found" }, 404);
    }

    if (path === "/api/portal/leads") {
      if (request.method === "GET") {
        const query = text(url.searchParams.get("q") || "", "search", 100).toLowerCase();
        const rows = user.role === "client"
          ? await db.prepare("SELECT id, title, description, city, state, created_at FROM portal_leads WHERE client_id = ? ORDER BY created_at DESC LIMIT 200").bind(user.id).all()
          : await db.prepare(`
            SELECT id, title, description, city, state, created_at FROM portal_leads
            WHERE instr(lower(title || ' ' || description || ' ' || city || ' ' || state), ?) > 0
            ORDER BY created_at DESC LIMIT 200
          `).bind(query).all();
        return json({ leads: rows.results });
      }
      if (request.method === "POST" && user.role === "client") {
        const body = await bodyJSON(request);
        const lead = {
          id: crypto.randomUUID(), title: text(body.title, "title", 120, true),
          description: text(body.description, "description", 3000, true),
          city: text(body.city, "city", 100, true), state: text(body.state, "state", 100, true)
        };
        await db.prepare(`
          INSERT INTO portal_leads (id, client_id, title, description, city, state, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(lead.id, user.id, lead.title, lead.description, lead.city, lead.state, new Date().toISOString()).run();
        return json({ lead }, 201);
      }
    }

    if (path === "/api/portal/threads" && request.method === "GET") {
      const rows = await db.prepare(`
        SELECT t.id, l.title, t.lead_id,
          CASE WHEN t.tree_id = ? THEN client.name ELSE tree.name END AS other_name,
          COALESCE((SELECT MAX(m.created_at) FROM portal_messages m WHERE m.thread_id = t.id), t.created_at) AS updated_at
        FROM portal_threads t
        JOIN portal_leads l ON l.id = t.lead_id
        JOIN portal_users client ON client.id = l.client_id
        JOIN portal_users tree ON tree.id = t.tree_id
        WHERE t.tree_id = ? OR l.client_id = ?
        ORDER BY updated_at DESC LIMIT 200
      `).bind(user.id, user.id, user.id).all();
      return json({ threads: rows.results });
    }
    if (path === "/api/portal/threads" && request.method === "POST" && user.role === "tree") {
      const body = await bodyJSON(request);
      const leadId = text(body.lead_id, "lead", 100, true);
      const lead = await db.prepare("SELECT id FROM portal_leads WHERE id = ?").bind(leadId).first();
      if (!lead) return json({ error: "Lead not found" }, 404);
      await db.prepare(`
        INSERT INTO portal_threads (id, lead_id, tree_id, created_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(lead_id, tree_id) DO NOTHING
      `).bind(crypto.randomUUID(), leadId, user.id, new Date().toISOString()).run();
      const thread = await db.prepare("SELECT id FROM portal_threads WHERE lead_id = ? AND tree_id = ?")
        .bind(leadId, user.id).first();
      return json({ thread }, 201);
    }

    const threadMatch = path.match(/^\/api\/portal\/threads\/([a-f0-9-]+)\/messages$/);
    if (threadMatch) {
      const thread = await threadForUser(db, threadMatch[1], user.id);
      if (!thread) return json({ error: "Conversation not found" }, 404);
      if (request.method === "GET") {
        const rows = await db.prepare(`
          SELECT m.id, m.body, m.created_at, m.sender_id, u.name AS sender_name
          FROM portal_messages m JOIN portal_users u ON u.id = m.sender_id
          WHERE m.thread_id = ? ORDER BY m.created_at ASC LIMIT 500
        `).bind(thread.id).all();
        return json({ thread, messages: rows.results });
      }
      if (request.method === "POST") {
        const body = await bodyJSON(request);
        const message = text(body.body, "message", 4000, true);
        if (!await limit(db, `message:${user.id}`, 60, 60000)) {
          return json({ error: "Too many messages. Try again later." }, 429);
        }
        await db.prepare(`
          INSERT INTO portal_messages (id, thread_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), thread.id, user.id, message, new Date().toISOString()).run();
        return json({ ok: true }, 201);
      }
    }
    return json({ error: "Not found" }, 404);
  } catch (error) {
    if (error instanceof InputError) return json({ error: error.message }, 400);
    console.error("Portal request failed:", error);
    return json({ error: "The service is temporarily unavailable" }, 500);
  }
}
