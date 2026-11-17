import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/work-weather.js";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("uses the forecast location's current hour and requests matching units", async () => {
  let forecastUrl;
  globalThis.fetch = async url => {
    forecastUrl = url;
    return Response.json({
      current: { time: "2026-07-01T14:15", temperature_2m: 80, wind_speed_10m: 15 },
      hourly: {
        time: ["2026-07-01T00:00", "2026-07-01T14:00", "2026-07-01T15:00"],
        temperature_2m: [60, 80, 81],
        visibility: [1000, 10000, 11000]
      },
      daily: { time: ["2026-07-01"], temperature_2m_max: [85], temperature_2m_min: [60] }
    });
  };
  const response = await handle(new Request("https://example.com/api/weather?lat=0&lon=0"));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(forecastUrl.searchParams.get("wind_speed_unit"), "mph");
  assert.equal(forecastUrl.searchParams.get("precipitation_unit"), "inch");
  assert.equal(data.hourly[0].time, "2026-07-01T14:00");
  assert.equal(data.current.visibility, 10000);
  assert.equal(data.location.lat, 0);
});

test("rejects invalid coordinates without calling the weather service", async () => {
  globalThis.fetch = () => { throw new Error("unexpected fetch"); };
  for (const query of ["lat=91&lon=0", "lat=&lon=0", "lat=1x&lon=0", "lat=0&lon=-181"]) {
    const response = await handle(new Request(`https://example.com/api/weather?${query}`));
    assert.equal(response.status, 400);
  }
});

test("reports missing locations and upstream failures", async () => {
  globalThis.fetch = async () => Response.json([]);
  const missing = await handle(new Request("https://example.com/api/weather?address=nowhere"));
  assert.equal(missing.status, 404);
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  const failed = await handle(new Request("https://example.com/api/weather?lat=1&lon=2"));
  assert.equal(failed.status, 502);
});
