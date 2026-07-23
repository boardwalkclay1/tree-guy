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
// GLOBAL CORS HEADERS
// ============================================================
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-RTG-User, X-RTG-Email, X-RTG-Type"
};

function wrap(response) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      // ============================================================
      // RTG ONLINE TREE GUY DASHBOARD
      // ============================================================
      if (path.startsWith(`${API_BASE}/rtg-online/tree-guy`)) {
        const res = await rtgDashWork.fetch(request, env);
        return wrap(res);
      }

      // ============================================================
      // MAP
      // ============================================================
      if (path.startsWith(`${API_BASE}/map`)) {
        const res = await MapLogic.handle(request, env);
        return wrap(res);
      }

      // ============================================================
      // CALENDAR
      // ============================================================
      if (path.startsWith(`${API_BASE}/calendar`)) {
        const res = await CalendarLogic.handle(request, env);
        return wrap(res);
      }

      // ============================================================
      // CONTRACTS CENTER (PROFILE / TEMPLATES / CLIENTS / DOCS / EMAIL / PHOTOS)
      // ============================================================
      if (
        path.startsWith(`${API_BASE}/profile`) ||
        path.startsWith(`${API_BASE}/templates`) ||
        path.startsWith(`${API_BASE}/clients`) ||
        path.startsWith(`${API_BASE}/upload-photo`) ||
        path.startsWith(`${API_BASE}/documents`) ||
        path.startsWith(`${API_BASE}/email`)
      ) {
        const res = await ContractLogic.handle(request, env);
        return wrap(res);
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
      // WEATHER (includes /api/weather and /api/weather/location)
      // ============================================================
      if (path.startsWith(`${API_BASE}/weather`)) {
        const res = await WeatherLogic.handle(request, env);
        return wrap(res);
      }

      // ============================================================
      // CUSTOMERS
      // ============================================================
      if (path.startsWith(`${API_BASE}/customers`)) {
        const res = await CustomerLogic.handle(request, env);
        return wrap(res);
      }

      // ============================================================
      // JOBS
      // ============================================================
      if (path.startsWith(`${API_BASE}/jobs`)) {
        const res = await JobLogic.handle(request, env);
        return wrap(res);
      }

      // ============================================================
      // STATIC ASSETS
      // ============================================================
      const assetRes = await env.ASSETS.fetch(request);
      return wrap(assetRes);

    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Worker crashed", detail: String(err) }, 500);
    }
  }
};
