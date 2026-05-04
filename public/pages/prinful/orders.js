// /pages/printful/orders.js
import { printfulRequest } from "./printful-client.js";

/**
 * Create an order in Printful
 * recipient: { name, address1, city, state_code, country_code, zip, email, phone }
 * items: [{ sync_variant_id, quantity }]
 */
export async function createOrder({ recipient, items, externalId }) {
  return await printfulRequest("/orders", {
    method: "POST",
    body: {
      external_id: externalId || `RTG-${Date.now()}`,
      recipient,
      items
    }
  });
}

/**
 * Get order by Printful order ID
 */
export async function getOrder(orderId) {
  return await printfulRequest(`/orders/${orderId}`);
}

/**
 * Get order by external_id (your own ID)
 */
export async function getOrderByExternalId(externalId) {
  return await printfulRequest(`/orders/@${externalId}`);
}
