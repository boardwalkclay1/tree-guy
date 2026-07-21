export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (path === "/api/rtg-online/tree-guy/dashboard" && request.method === "GET") {
      const treeGuyId = url.searchParams.get("id");

      const user = await env.DB.prepare(
        `SELECT id, name, email, phone, avatar_url, address, city, state, zip,
                lat, lng, bio, subscription_status, tree_role
         FROM users
         WHERE id = ? AND type = 'tree'`
      ).bind(treeGuyId).first();

      const customers = await env.DB.prepare(
        "SELECT * FROM customers ORDER BY created_at DESC"
      ).all();

      const jobPosts = await env.DB.prepare(
        "SELECT * FROM job_posts ORDER BY created_at DESC"
      ).all();

      const posts = await env.DB.prepare(
        "SELECT p.id, p.user_id, u.name AS user_name, p.type, p.content, p.media_url,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS like_count
         FROM posts p
         LEFT JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC"
      ).all();

      const comments = await env.DB.prepare(
        `SELECT c.id, c.post_id, c.user_id, u.name AS user_name, c.text
         FROM post_comments c
         LEFT JOIN users u ON u.id = c.user_id
         ORDER BY c.created_at ASC`
      ).all();

      const messages = await env.DB.prepare(
        `SELECT m.id, m.from_id, u.name AS from_name, m.text, m.created_at
         FROM messages m
         LEFT JOIN users u ON u.id = m.from_id
         WHERE m.to_id = ?
         ORDER BY m.created_at DESC`
      ).bind(treeGuyId).all();

      const friends = await env.DB.prepare(
        `SELECT f.id, f.friend_id, u.name AS friend_name
         FROM friends f
         LEFT JOIN users u ON u.id = f.friend_id
         WHERE f.user_id = ?`
      ).bind(treeGuyId).all();

      const skills = await env.DB.prepare(
        "SELECT id, name, level FROM skills WHERE user_id = ?"
      ).bind(treeGuyId).all();

      const equipment = await env.DB.prepare(
        "SELECT id, name, years FROM equipment WHERE user_id = ?"
      ).bind(treeGuyId).all();

      // Attach comments to posts
      const postsWithComments = posts.results.map(p => ({
        ...p,
        comments: comments.results.filter(c => c.post_id === p.id)
      }));

      return json({
        user,
        customers: customers.results,
        jobPosts: jobPosts.results,
        posts: postsWithComments,
        messages: messages.results,
        friends: friends.results,
        skills: skills.results,
        equipment: equipment.results
      });
    }

    // PROFILE UPDATE
    if (path === "/api/rtg-online/tree-guy/profile" && request.method === "POST") {
      const body = await request.json();
      const { id, name, tree_role, city, state, avatar_url, bio } = body;

      await env.DB.prepare(
        `UPDATE users
         SET name = ?, tree_role = ?, city = ?, state = ?, avatar_url = ?, bio = ?
         WHERE id = ? AND type = 'tree'`
      ).bind(name, tree_role, city, state, avatar_url, bio, id).run();

      return json({ ok: true });
    }

    // CREATE POST
    if (path === "/api/rtg-online/tree-guy/post" && request.method === "POST") {
      const body = await request.json();
      const { id, content, media_url, type } = body;

      await env.DB.prepare(
        `INSERT INTO posts (id, user_id, type, content, media_url, created_at)
         VALUES (hex(randomblob(16)), ?, ?, ?, ?, strftime('%s','now'))`
      ).bind(id, type, content, media_url).run();

      return json({ ok: true });
    }

    // LIKE POST
    if (path === "/api/rtg-online/tree-guy/like" && request.method === "POST") {
      const body = await request.json();
      const { id, post_id } = body;

      await env.DB.prepare(
        `INSERT INTO post_likes (post_id, user_id, created_at)
         VALUES (?, ?, strftime('%s','now'))`
      ).bind(post_id, id).run();

      return json({ ok: true });
    }

    // COMMENT POST
    if (path === "/api/rtg-online/tree-guy/comment" && request.method === "POST") {
      const body = await request.json();
      const { id, post_id, text } = body;

      await env.DB.prepare(
        `INSERT INTO post_comments (post_id, user_id, text, created_at)
         VALUES (?, ?, ?, strftime('%s','now'))`
      ).bind(post_id, id, text).run();

      return json({ ok: true });
    }

    // ADD SKILL
    if (path === "/api/rtg-online/tree-guy/skill" && request.method === "POST") {
      const body = await request.json();
      const { id, name, level } = body;

      await env.DB.prepare(
        `INSERT INTO skills (user_id, name, level)
         VALUES (?, ?, ?)`
      ).bind(id, name, level).run();

      return json({ ok: true });
    }

    // ADD EQUIPMENT
    if (path === "/api/rtg-online/tree-guy/equipment" && request.method === "POST") {
      const body = await request.json();
      const { id, name, years } = body;

      await env.DB.prepare(
        `INSERT INTO equipment (user_id, name, years)
         VALUES (?, ?, ?)`
      ).bind(id, name, years).run();

      return json({ ok: true });
    }

    return json({ error: "Not Found" }, 404);
  }
};
