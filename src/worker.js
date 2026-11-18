import * as Weather from "./work-weather.js";
import * as Portal from "./portal.js";

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    try {
      if (path === "/api/weather") return await Weather.handle(request, env);
      if (path.startsWith("/api/portal/")) return await Portal.handle(request, env);
      if (path === "/api" || path.startsWith("/api/") ||
          path === "/client" || path.startsWith("/client/") ||
          path.startsWith("/rtg/api/") || path === "/printful-upload") {
        return Response.json({
          error: "This legacy service is unavailable while it is being secured."
        }, { status: 503, headers: { "Cache-Control": "no-store" } });
      }
      if ([
        "/pages/login.html", "/pages/sign-up.html", "/pages/signup-tree.html",
        "/pages/signup-client.html", "/pages/create-password.html", "/pages/paywall.html",
        "/pages/dashboard.html", "/pages/customers.html", "/pages/messages.html",
        "/rtg-online/client/pages/client-login.html"
      ].includes(path)) {
        return Response.redirect(new URL("/pages/portal.html", request.url), 302);
      }
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Worker request failed:", error);
      return Response.json({ error: "The service is temporarily unavailable" }, { status: 500 });
    }
  }
};
