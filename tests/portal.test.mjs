import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../src/worker.js";

function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../migrations/0001_portal.sql", import.meta.url), "utf8"));
  return {
    close: () => sqlite.close(),
    prepare(sql) {
      let params = [];
      return {
        bind(...args) { params = args; return this; },
        async first() { return sqlite.prepare(sql).get(...params) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...params) }; },
        async run() { return { meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } }; }
      };
    }
  };
}

test("accounts and payment gates fail closed", async () => {
  const DB = database();
  const env = { DB, ASSETS: { fetch: () => new Response("asset") } };
  async function call(path, { method = "GET", data, cookie, origin = "https://example.com", ip = "127.0.0.1" } = {}) {
    const headers = { "CF-Connecting-IP": ip };
    if (method !== "GET") headers.Origin = origin;
    if (data !== undefined) headers["Content-Type"] = "application/json";
    if (cookie) headers.Cookie = cookie;
    const response = await worker.fetch(new Request(`https://example.com${path}`, {
      method, headers, body: data === undefined ? undefined : JSON.stringify(data)
    }), env);
    return { status: response.status, cookie: response.headers.get("set-cookie")?.split(";")[0], body: await response.json() };
  }
  async function register(email, role) {
    return call("/api/portal/register", {
      method: "POST", data: { name: email, email, role, password: "A-long-unique-password!" }
    });
  }
  try {
    const client = await register("customer@example.com", "client");
    const tree = await register("tree@example.com", "tree");
    const otherClient = await register("other@example.com", "client");
    assert.equal(client.status, 201);
    assert.equal(tree.status, 201);
    assert.ok(tree.cookie.startsWith("__Host-rtg_session="));
    assert.equal((await call("/api/portal/me")).status, 401);
    assert.equal((await call("/api/customers")).status, 503);
    assert.equal((await call("/api/portal/contacts", {
      method: "POST", cookie: tree.cookie, origin: "https://attacker.example", data: { name: "Bad" }
    })).status, 403);

    const contact = await call("/api/portal/contacts", {
      method: "POST", cookie: tree.cookie, data: { name: "Alice", notes: "private" }
    });
    assert.equal(contact.status, 503);
    assert.match(contact.body.error, /\$30 monthly/);
    const lead = await call("/api/portal/leads", {
      method: "POST", cookie: client.cookie,
      data: { title: "Remove oak", description: "Damaged limb", city: "Athens", state: "GA" }
    });
    assert.equal(lead.status, 503);
    assert.match(lead.body.error, /\$10/);
    assert.equal((await call("/api/portal/leads", { cookie: client.cookie })).body.leads.length, 0);
    assert.equal((await call("/api/portal/threads/11111111-1111-1111-1111-111111111111/messages", { cookie: client.cookie })).status, 404);
    const leadId = crypto.randomUUID();
    const threadId = crypto.randomUUID();
    await DB.prepare("INSERT INTO portal_leads (id, client_id, title, description, city, state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(leadId, client.body.user.id, "Oak", "Prune", "Athens", "GA", new Date().toISOString()).run();
    await DB.prepare("INSERT INTO portal_threads (id, lead_id, tree_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(threadId, leadId, tree.body.user.id, new Date().toISOString()).run();
    const messagePath = `/api/portal/threads/${threadId}/messages`;
    assert.equal((await call(messagePath, { method: "POST", cookie: client.cookie, data: { body: "Hello" } })).status, 201);
    assert.equal((await call(messagePath, { cookie: client.cookie })).body.messages[0].body, "Hello");
    assert.equal((await call(messagePath, { cookie: otherClient.cookie })).status, 404);
    assert.equal((await call(messagePath, { method: "POST", cookie: otherClient.cookie, data: { body: "Intrusion" } })).status, 404);
    assert.equal((await call("/api/portal/logout", { method: "POST", cookie: tree.cookie })).status, 200);
    assert.equal((await call("/api/portal/me", { cookie: tree.cookie })).status, 401);
    assert.equal((await call("/api/portal/login", {
      method: "POST", data: { email: "tree@example.com", password: "wrong" }
    })).status, 401);
    assert.equal((await call("/api/portal/login", {
      method: "POST", data: { email: "tree@example.com", password: "A-long-unique-password!" }
    })).status, 200);
  } finally {
    DB.close();
  }
});
