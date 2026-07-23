// ============================================================
// REAL TREE GUY — MAIN WORKER (FULL FIXED VERSION)
// ============================================================

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

// ============================================================
// GLOBAL CORS HEADERS — FIXED
// ============================================================
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type, X-RTG-Name"
};

// ============================================================
// WRAPPERS
// ============================================================
function wrap(response) {
  if (!response) {
    return new Response("Worker returned null", { status: 500 });
  }

  // WebSocket passthrough
  if (response.status === 101 || response.webSocket) return response;

  const newHeaders = new Headers(response.headers);
  Object.entries(CORS).forEach(([k, v]) => newHeaders.set(k, v));

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS
    }
  });
}

// ============================================================
// MAIN WORKER
// ============================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // OPTIONS — REQUIRED FOR CORS
    // ============================================================
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      // ============================================================
      // RTG ONLINE TREE GUY DASHBOARD
      // ============================================================
      if (path.startsWith(`${API_BASE}/rtg-online/tree-guy`)) {
        return wrap(await rtgDashWork.fetch(request, env));
      }

      // ============================================================
      // MAP
      // ============================================================
      if (path.startsWith(`${API_BASE}/map`)) {
        return wrap(await MapLogic.handle(request, env));
      }

      // ============================================================
      // CALENDAR
      // ============================================================
      if (path.startsWith(`${API_BASE}/calendar`)) {
        return wrap(await CalendarLogic.handle(request, env));
      }

      // ============================================================
      // CONTRACTS CENTER
      // ============================================================
      if (
        path.startsWith(`${API_BASE}/profile`) ||
        path.startsWith(`${API_BASE}/templates`) ||
        path.startsWith(`${API_BASE}/clients`) ||
        path.startsWith(`${API_BASE}/upload-photo`) ||
        path.startsWith(`${API_BASE}/documents`) ||
        path.startsWith(`${API_BASE}/email`)
      ) {
        return wrap(await ContractLogic.handle(request, env));
      }

      // ============================================================
      // RADIO (WebSocket + HTTP)
      // ============================================================
      if (path.startsWith(`${API_BASE}/radio`)) {
        const res = await RadioLogic.handle(request, env);
        if (res.status === 101 || res.webSocket) return res;
        return wrap(res);
      }

      // ============================================================
      // WEATHER
      // ============================================================
      if (path.startsWith(`${API_BASE}/weather`)) {
        return wrap(await WeatherLogic.handle(request, env));
      }

      // ============================================================
      // CUSTOMERS
      // ============================================================
      if (path.startsWith(`${API_BASE}/customers`)) {
        return wrap(await CustomerLogic.handle(request, env));
      }

      // ============================================================
      // JOBS
      // ============================================================
      if (path.startsWith(`${API_BASE}/jobs`)) {
        return wrap(await JobLogic.handle(request, env));
      }

      // ============================================================
      // STATIC ASSETS — FIXED MIME HANDLING
      // ============================================================
      const assetRes = await env.ASSETS.fetch(request);

      const ext = path.split(".").pop().toLowerCase();

      // Fix JS MIME type (prevents HTML fallback errors)
      if (ext === "js") {
        return new Response(assetRes.body, {
          status: assetRes.status,
          headers: {
            "Content-Type": "application/javascript",
            ...CORS
          }
        });
      }

      return wrap(assetRes);

    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Worker crashed", detail: String(err) }, 500);
    }
  }
};
