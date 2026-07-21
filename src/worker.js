import * as MapLogic from "./work-map.js";
import * as CalendarLogic from "./work-calendar.js";
import * as ContractLogic from "./work-contracts.js";
import * as RadioLogic from "./work-radio.js";
import * as WeatherLogic from "./work-weather.js";
import * as CustomerLogic from "./work-customers.js";
import * as JobLogic from "./work-jobs.js";

// RTG Online Tree Guy dashboard worker
import rtgDashWork from "../public/rtg-online/tree-guy/src/workers/rtg-dash-work.js";

export const API_BASE = "/api";

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // CORS PRE-FLIGHT
    // ============================================================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
        }
      });
    }

    // ============================================================
    // RTG ONLINE TREE GUY DASHBOARD (SOCIAL + PROFILE + MAP + LEADS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/rtg-online/tree-guy`)) {
      // All routes like:
      // /api/rtg-online/tree-guy/dashboard
      // /api/rtg-online/tree-guy/profile
      // /api/rtg-online/tree-guy/post
      // /api/rtg-online/tree-guy/like
      // /api/rtg-online/tree-guy/comment
      // /api/rtg-online/tree-guy/skill
      // /api/rtg-online/tree-guy/equipment
      return rtgDashWork.fetch(request, env);
    }

    // ============================================================
    // MAP (OFFLINE TREE GUY OS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/map`)) {
      return MapLogic.handle(request, env);
    }

    // ============================================================
    // CALENDAR (OFFLINE TREE GUY OS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/calendar`)) {
      return CalendarLogic.handle(request, env);
    }

    // ============================================================
    // CONTRACTS (OFFLINE TREE GUY OS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/contracts`)) {
      return ContractLogic.handle(request, env);
    }

    // ============================================================
    // RADIO (OFFLINE TREE GUY OS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/radio`)) {
      return RadioLogic.handle(request, env);
    }

    // ============================================================
    // WEATHER (OFFLINE TREE GUY OS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/weather`)) {
      return WeatherLogic.handle(request, env);
    }

    // ============================================================
    // CUSTOMERS (OFFLINE TREE GUY OS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/customers`)) {
      return CustomerLogic.handle(request, env);
    }

    // ============================================================
    // JOBS (OFFLINE TREE GUY OS)
    // ============================================================
    if (path.startsWith(`${API_BASE}/jobs`)) {
      return JobLogic.handle(request, env);
    }

    // ============================================================
    // STATIC ASSETS (Pages, JS, CSS)
    // ============================================================
    return env.ASSETS.fetch(request);
  }
};
