// src/worker.js
// REAL TREE GUY OS — Cloudflare Worker
// Auth • Jobs • Leads • PayPal • Printful Shop • Messaging

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function uid() {
  // simple unique id
  return crypto.randomUUID();
}

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

async function verifyPassword(password, hash) {
  const h = await hashPassword(password);
  return h === hash;
}

async function signJwt(payload, secret) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

async function verifyJwt(token, secret) {
  const [headerB64, bodyB64, sigB64] = token.split(".");
  if (!headerB64 || !bodyB64 || !sigB64) return null;
  const data = `${headerB64}.${bodyB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(data)
  );
  if (!ok) return null;
  return JSON.parse(atob(bodyB64));
}

async function getUserFromAuth(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  return payload || null;
}

// -------------------- PAYPAL HELPERS --------------------
async function getPayPalAccessToken(env) {
  const basicAuth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const json = await res.json();
  return json.access_token;
}

async function createPayPalOrder(env, amountCents, customId) {
  const accessToken = await getPayPalAccessToken(env);
  const res = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: (amountCents / 100).toFixed(2)
          },
          custom_id: customId
        }
      ]
    })
  });
  const json = await res.json();
  const approveLink = json.links?.find(l => l.rel === "approve")?.href;
  return { orderId: json.id, approveUrl: approveLink };
}

// -------------------- PRINTFUL HELPERS --------------------
async function createPrintfulOrder(env, cart, customer) {
  // cart: [{ variant_id, quantity }]
  // customer: { name, address1, city, state, zip, country, email, phone }
  const res = await fetch(`${env.PRINTFUL_API_BASE || "https://api.printful.com"}/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.PRINTFUL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipient: {
        name: customer.name,
        address1: customer.address1,
        city: customer.city,
        state_code: customer.state,
        country_code: customer.country || "US",
        zip: customer.zip,
        email: customer.email,
        phone: customer.phone || ""
      },
      items: cart.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        retail_price: item.price ? item.price.toFixed(2) : undefined,
        name: item.name
      }))
    })
  });

  const json = await res.json();
  return json;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // ---------- AUTH ----------
    if (pathname === "/api/auth/signup" && request.method === "POST") {
      const body = await request.json();
      const { email, password, type, profile } = body;
      if (!email || !password || !type) {
        return jsonResponse({ error: "Missing fields" }, 400);
      }

      const id = uid();
      const now = new Date().toISOString();
      const password_hash = await hashPassword(password);

      try {
        await env.DB.prepare(
          "INSERT INTO users (id,email,password_hash,type,created_at) VALUES (?,?,?,?,?)"
        ).bind(id, email, password_hash, type, now).run();
      } catch (e) {
        return jsonResponse({ error: "Email already exists" }, 400);
      }

      if (type === "tree") {
        const roles = JSON.stringify(profile?.roles || []);
        await env.DB.prepare(
          `INSERT INTO tree_profile
           (user_id,display_name,company_name,roles,bio,service_area,experience_years,insurance_proof_url,avatar_url)
           VALUES (?,?,?,?,?,?,?,?,?)`
        ).bind(
          id,
          profile?.display_name || email,
          profile?.company_name || null,
          roles,
          profile?.bio || null,
          profile?.service_area || null,
          profile?.experience_years || 0,
          profile?.insurance_proof_url || null,
          profile?.avatar_url || null
        ).run();
      } else if (type === "client") {
        await env.DB.prepare(
          `INSERT INTO client_profile
           (user_id,name,phone,address_line1,address_line2,city,state,zip,notes)
           VALUES (?,?,?,?,?,?,?,?,?)`
        ).bind(
          id,
          profile?.name || email,
          profile?.phone || null,
          profile?.address_line1 || null,
          profile?.address_line2 || null,
          profile?.city || null,
          profile?.state || null,
          profile?.zip || null,
          profile?.notes || null
        ).run();
      }

      const token = await signJwt({ id, email, type }, env.JWT_SECRET);
      return jsonResponse({ token, user: { id, email, type } }, 201);
    }

    if (pathname === "/api/auth/login" && request.method === "POST") {
      const body = await request.json();
      const { email, password } = body;
      const row = await env.DB.prepare(
        "SELECT * FROM users WHERE email = ?"
      ).bind(email).first();

      if (!row) return jsonResponse({ error: "Invalid credentials" }, 401);
      const ok = await verifyPassword(password, row.password_hash);
      if (!ok) return jsonResponse({ error: "Invalid credentials" }, 401);

      const token = await signJwt({ id: row.id, email: row.email, type: row.type }, env.JWT_SECRET);
      await env.DB.prepare(
        "UPDATE users SET last_login_at = ? WHERE id = ?"
      ).bind(new Date().toISOString(), row.id).run();

      return jsonResponse({ token, user: { id: row.id, email: row.email, type: row.type } });
    }

    // ---------- AUTH GUARD ----------
    const user = await getUserFromAuth(request, env);
    if (pathname.startsWith("/api/") &&
        !["/api/auth/signup","/api/auth/login","/api/paypal/webhook"].includes(pathname)) {
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // ---------- JOBS ----------
    if (pathname === "/api/jobs" && request.method === "POST") {
      if (user.type !== "client") return jsonResponse({ error: "Only clients can create jobs" }, 403);
      const body = await request.json();
      const id = uid();
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO jobs
         (id,client_id,title,description,status,location_city,location_state,location_zip,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      ).bind(
        id,
        user.id,
        body.title,
        body.description || null,
        "open",
        body.location_city || null,
        body.location_state || null,
        body.location_zip || null,
        now,
        now
      ).run();
      return jsonResponse({ id }, 201);
    }

    if (pathname === "/api/jobs" && request.method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC"
      ).all();
      return jsonResponse(rows.results || []);
    }

    // ---------- LEADS (TREE SIDE) ----------
    if (pathname === "/api/leads/create" && request.method === "POST") {
      if (user.type !== "tree") return jsonResponse({ error: "Only tree users can create leads" }, 403);
      const body = await request.json();
      const { job_id, price_cents } = body;
      const id = uid();
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO leads
         (id,job_id,tree_user_id,status,price_cents,created_at)
         VALUES (?,?,?,?,?,?)`
      ).bind(
        id,
        job_id,
        user.id,
        "viewed",
        price_cents,
        now
      ).run();

      // create PayPal order for this lead
      const customId = `lead:${id}`;
      const { orderId, approveUrl } = await createPayPalOrder(env, price_cents, customId);

      return jsonResponse({ lead_id: id, paypal_order_id: orderId, approve_url: approveUrl }, 201);
    }

    // ---------- SHOP (PRINTFUL) ----------
    // Frontend sends: { cart: [{variant_id, quantity, price, name}], customer: {...}, total_cents }
    if (pathname === "/api/shop/create-order" && request.method === "POST") {
      const body = await request.json();
      const { cart, customer, total_cents } = body;
      if (!cart || !cart.length || !customer || !total_cents) {
        return jsonResponse({ error: "Missing cart or customer" }, 400);
      }

      // encode cart+customer into custom_id (small carts only)
      const payload = btoa(JSON.stringify({ cart, customer }));
      const customId = `shop:${payload}`;

      const { orderId, approveUrl } = await createPayPalOrder(env, total_cents, customId);

      return jsonResponse({ paypal_order_id: orderId, approve_url: approveUrl }, 201);
    }

    // ---------- PAYPAL WEBHOOK ----------
    if (pathname === "/api/paypal/webhook" && request.method === "POST") {
      // NOTE: in production, verify PayPal webhook signature
      const body = await request.json();

      if (body.event_type === "CHECKOUT.ORDER.APPROVED") {
        const order = body.resource;
        const orderId = order.id;
        const customId = order.purchase_units?.[0]?.custom_id || "";

        // LEAD PAYMENT
        if (customId.startsWith("lead:")) {
          const leadId = customId.slice("lead:".length);
          await env.DB.prepare(
            "UPDATE leads SET status = 'purchased', paypal_order_id = ? WHERE id = ?"
          ).bind(orderId, leadId).run();
        }

        // SHOP ORDER (PRINTFUL)
        if (customId.startsWith("shop:")) {
          const encoded = customId.slice("shop:".length);
          try {
            const decoded = JSON.parse(atob(encoded));
            const { cart, customer } = decoded;
            await createPrintfulOrder(env, cart, customer);
          } catch (e) {
            // swallow for now, log later
          }
        }
      }

      return new Response("OK", { status: 200 });
    }

    // ---------- MESSAGES ----------
    if (pathname === "/api/messages" && request.method === "POST") {
      const body = await request.json();
      const { job_id, to_user_id, body: text } = body;
      const id = uid();
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO messages
         (id,job_id,from_user_id,to_user_id,body,created_at)
         VALUES (?,?,?,?,?,?)`
      ).bind(
        id,
        job_id,
        user.id,
        to_user_id,
        text,
        now
      ).run();
      return jsonResponse({ id }, 201);
    }

    if (pathname.startsWith("/api/messages/") && request.method === "GET") {
      const jobId = pathname.split("/").pop();
      const rows = await env.DB.prepare(
        "SELECT * FROM messages WHERE job_id = ? ORDER BY created_at ASC"
      ).bind(jobId).all();
      return jsonResponse(rows.results || []);
    }

    return jsonResponse({ error: "Not found" }, 404);
  }
};
