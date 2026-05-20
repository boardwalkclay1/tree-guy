export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    const db = env["rtg-db"];

    // ============================================================
    // PROFILE
    // ============================================================
    if (path === "/api/profile") {
      if (req.method === "GET") {
        const row = await db.prepare(
          "SELECT * FROM profile WHERE id = 'PROFILE'"
        ).first();

        return Response.json(row || {
          id: "PROFILE",
          name: "",
          biz: "",
          phone: "",
          email: "",
          address: "",
          bio: "",
          logo: "",
          lat: null,
          lon: null
        });
      }

      if (req.method === "POST") {
        const p = await req.json();

        await db.prepare(`
          INSERT INTO profile (id, name, biz, phone, email, address, bio, logo, lat, lon)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
          ON CONFLICT(id) DO UPDATE SET
            name=?2, biz=?3, phone=?4, email=?5, address=?6, bio=?7, logo=?8, lat=?9, lon=?10
        `).bind(
          p.id, p.name, p.biz, p.phone, p.email, p.address, p.bio, p.logo, p.lat, p.lon
        ).run();

        return Response.json({ ok: true });
      }
    }

    // ============================================================
    // CUSTOMERS
    // ============================================================
    if (path === "/api/customers") {
      if (req.method === "GET") {
        const rows = await db.prepare("SELECT * FROM customers ORDER BY name ASC").all();
        return Response.json(rows.results || []);
      }

      if (req.method === "POST") {
        const c = await req.json();

        await db.prepare(`
          INSERT INTO customers (id, name, phone, email, address, notes)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        `).bind(
          c.id, c.name, c.phone, c.email, c.address, c.notes
        ).run();

        return Response.json({ ok: true });
      }

      if (req.method === "DELETE") {
        const id = url.searchParams.get("id");

        await db.prepare("DELETE FROM customers WHERE id = ?1")
          .bind(id)
          .run();

        return Response.json({ ok: true });
      }
    }

    // ============================================================
    // JOBS
    // ============================================================
    if (path === "/api/jobs") {
      if (req.method === "GET") {
        const rows = await db.prepare("SELECT * FROM jobs ORDER BY date ASC").all();
        return Response.json(rows.results || []);
      }

      if (req.method === "POST") {
        const j = await req.json();

        await db.prepare(`
          INSERT INTO jobs (id, title, customer, date, price, status, notes)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        `).bind(
          j.id, j.title, j.customer, j.date, j.price, j.status, j.notes
        ).run();

        return Response.json({ ok: true });
      }

      if (req.method === "DELETE") {
        const id = url.searchParams.get("id");

        await db.prepare("DELETE FROM jobs WHERE id = ?1")
          .bind(id)
          .run();

        return Response.json({ ok: true });
      }
    }

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    if (path === "/api/notifications") {
      if (req.method === "GET") {
        const rows = await db.prepare(
          "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
        ).all();

        return Response.json(rows.results || []);
      }

      if (req.method === "POST") {
        const n = await req.json();

        await db.prepare(`
          INSERT INTO notifications (id, type, message, created_at)
          VALUES (?1, ?2, ?3, strftime('%s','now'))
        `).bind(
          crypto.randomUUID(),
          n.type || "info",
          n.message || ""
        ).run();

        return Response.json({ ok: true });
      }
    }

    // ============================================================
    // DASHBOARD — TODAY'S JOB
    // ============================================================
    if (path === "/api/dashboard/today") {
      const today = new Date().toISOString().split("T")[0];

      const job = await db.prepare(`
        SELECT * FROM jobs
        WHERE date = ?1
        ORDER BY date ASC
        LIMIT 1
      `).bind(today).first();

      return Response.json(job || {});
    }

    // ============================================================
    // FALLBACK
    // ============================================================
    return new Response("Not Found", { status: 404 });
  }
};
