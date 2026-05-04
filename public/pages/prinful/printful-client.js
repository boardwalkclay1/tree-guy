// /pages/printful/printful-client.js
import { PRINTFUL_TOKEN, PRINTFUL_BASE_URL } from "./printful-config.js";

async function printfulRequest(path, options = {}) {
  const url = `${PRINTFUL_BASE_URL}${path}`;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Authorization": `Bearer ${PRINTFUL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json();

  if (!res.ok || data.code >= 400) {
    console.error("Printful API error:", data);
    throw new Error(data?.error?.message || data?.result || "Printful API error");
  }

  return data.result;
}

export { printfulRequest };
