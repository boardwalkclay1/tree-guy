export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Unified response helper
    const json = (obj) =>
      new Response(JSON.stringify(obj), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });

    // Extract tree guy ID
    const treeGuyId = url.searchParams.get("id");

    // ROUTES
    if (path === "/api/pro/dashboard") {
      const user = await env.DB.prepare(
        "SELECT id, name, email, phone, avatar_url, address, city, state, zip, lat, lng, bio, subscription_status FROM users WHERE id = ? AND type = 'tree'"
      ).bind(treeGuyId).first();

      const customers = await env.DB.prepare(
        "SELECT * FROM customers ORDER BY created_at DESC"
      ).all();

      const jobs = await env.DB.prepare(
        "SELECT * FROM jobs ORDER BY created_at DESC"
      ).all();

      const events = await env.DB.prepare(
        "SELECT * FROM calendar_events ORDER BY date ASC"
      ).all();

      const savedLocations = await env.DB.prepare(
        "SELECT * FROM saved_locations ORDER BY created_at DESC"
      ).all();

      const nearbyPosts = await env.DB.prepare(
        "SELECT * FROM job_posts ORDER BY created_at DESC"
      ).all();

      const socialFeed = await env.DB.prepare(
        "SELECT * FROM posts ORDER BY created_at DESC"
      ).all();

      return json({
        user,
        customers: customers.results,
        jobs: jobs.results,
        events: events.results,
        savedLocations: savedLocations.results,
        nearbyPosts: nearbyPosts.results,
        socialFeed: socialFeed.results
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
