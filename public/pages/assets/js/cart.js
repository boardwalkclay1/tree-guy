// CART JS – Real Tree Guy OS

const CART_KEY = "rtg_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

const API = {
  token: localStorage.getItem("rtgToken") || null,

  headers() {
    return this.token
      ? { "Authorization": `Bearer ${this.token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  },

  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

// Called from cart.html
export function loadCart() {
  const items = getCart();
  const listEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!listEl || !totalEl) return;

  listEl.innerHTML = "";

  if (items.length === 0) {
    listEl.innerHTML = `<p>Your cart is empty.</p>`;
    totalEl.textContent = "Total: $0.00";
    return;
  }

  let totalCents = 0;

  items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const title = document.createElement("div");
    title.className = "cart-item-title";
    title.textContent = item.name || `Item ${idx + 1}`;

    const qty = document.createElement("div");
    qty.className = "cart-item-qty";
    qty.textContent = `Qty: ${item.quantity || 1}`;

    const price = document.createElement("div");
    price.className = "cart-item-price";
    price.textContent = formatMoney(item.price_cents || 0);

    totalCents += (item.price_cents || 0) * (item.quantity || 1);

    row.appendChild(title);
    row.appendChild(qty);
    row.appendChild(price);
    listEl.appendChild(row);
  });

  totalEl.textContent = `Total: ${formatMoney(totalCents)}`;
}

// Called from cart.html
export async function checkoutCart() {
  const items = getCart();
  if (!items.length) return;

  // Build payload for Worker → PayPal → Printful
  const totalCents = items.reduce(
    (sum, item) => sum + (item.price_cents || 0) * (item.quantity || 1),
    0
  );

  const customer = {}; // you can enrich this later from profile

  const payload = {
    cart: items.map(i => ({
      variant_id: i.variant_id,
      quantity: i.quantity || 1,
      price: (i.price_cents || 0) / 100,
      name: i.name
    })),
    customer,
    total_cents: totalCents
  };

  const data = await API.post("/api/shop/create-order", payload);

  if (data && data.approve_url) {
    // Clear cart and send to PayPal
    setCart([]);
    window.location.href = data.approve_url;
  } else {
    alert("Could not start checkout.");
  }
}

// helper for shop.js to add items
export function addToCart(item) {
  const items = getCart();
  items.push(item);
  setCart(items);
}
