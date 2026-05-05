// ============================================================
// REAL TREE GUY OS — REAL TREE SHOP
// Printful-powered shop (frontend)
// ============================================================

const productGrid = document.getElementById("productGrid");
const categoryList = document.getElementById("categoryList");
const currentCategoryLabel = document.getElementById("currentCategoryLabel");
const productSearch = document.getElementById("productSearch");

const cartButton = document.getElementById("cartButton");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const checkoutButton = document.getElementById("checkoutButton");

const checkoutModal = document.getElementById("checkoutModal");
const cancelCheckout = document.getElementById("cancelCheckout");
const confirmCheckout = document.getElementById("confirmCheckout");

const custName = document.getElementById("custName");
const custEmail = document.getElementById("custEmail");
const custPhone = document.getElementById("custPhone");
const custAddress = document.getElementById("custAddress");

const logoFileInput = document.getElementById("logoFile");
const logoPreview = document.getElementById("logoPreview");

let products = [];
let filteredProducts = [];
let categories = [];
let cart = [];
let logoDataUrl = null;

/* ============================================================
   FETCH PRODUCTS FROM PRINTFUL BACKEND
============================================================ */
async function loadProducts() {
  const res = await fetch("/api/printful/products");
  if (!res.ok) {
    console.error("Failed to load products");
    return;
  }
  const data = await res.json();
  products = data.products || [];
  filteredProducts = products.slice();

  buildCategories();
  renderProducts();
}

/* ============================================================
   CATEGORIES
============================================================ */
function buildCategories() {
  const set = new Set();
  products.forEach(p => {
    if (p.category) set.add(p.category);
  });

  categories = ["All", ...Array.from(set)];
  categoryList.innerHTML = "";

  categories.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = cat;
    li.className = "rtg-shop-category-item";
    li.onclick = () => {
      filterByCategory(cat);
    };
    categoryList.appendChild(li);
  });
}

function filterByCategory(cat) {
  if (cat === "All") {
    filteredProducts = products.slice();
    currentCategoryLabel.textContent = "All Products";
  } else {
    filteredProducts = products.filter(p => p.category === cat);
    currentCategoryLabel.textContent = cat;
  }
  renderProducts();
}

/* ============================================================
   SEARCH
============================================================ */
productSearch.oninput = () => {
  const q = productSearch.value.toLowerCase();
  filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q)
  );
  renderProducts();
};

/* ============================================================
   RENDER PRODUCTS
============================================================ */
function renderProducts() {
  productGrid.innerHTML = "";

  if (!filteredProducts.length) {
    productGrid.innerHTML = `<p>No products found.</p>`;
    return;
  }

  filteredProducts.forEach(p => {
    const card = document.createElement("div");
    card.className = "rtg-shop-card";

    card.innerHTML = `
      <div class="rtg-shop-card-image" style="background-image:url('${p.thumbnail || ""}')"></div>
      <div class="rtg-shop-card-body">
        <h3>${p.name}</h3>
        <p>${p.description || ""}</p>
        <div class="rtg-shop-card-footer">
          <span class="rtg-shop-price">$${(p.price || 0).toFixed(2)}</span>
          <button class="rtg-shop-add-btn">Add to Cart</button>
        </div>
      </div>
    `;

    const addBtn = card.querySelector(".rtg-shop-add-btn");
    addBtn.onclick = () => addToCart(p);

    productGrid.appendChild(card);
  });
}

/* ============================================================
   CART LOGIC
============================================================ */
function addToCart(product) {
  const existing = cart.find(item => item.product.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      product,
      qty: 1
    });
  }
  updateCartUI();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
}

function updateCartUI() {
  cartItemsEl.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item, idx) => {
    const lineTotal = (item.product.price || 0) * item.qty;
    total += lineTotal;
    count += item.qty;

    const row = document.createElement("div");
    row.className = "rtg-shop-cart-row";

    row.innerHTML = `
      <div class="rtg-shop-cart-row-main">
        <div class="rtg-shop-cart-row-title">${item.product.name}</div>
        <div class="rtg-shop-cart-row-meta">$${(item.product.price || 0).toFixed(2)} each</div>
      </div>
      <div class="rtg-shop-cart-row-controls">
        <button class="rtg-shop-qty-btn" data-delta="-1">-</button>
        <span class="rtg-shop-qty">${item.qty}</span>
        <button class="rtg-shop-qty-btn" data-delta="1">+</button>
        <span class="rtg-shop-line-total">$${lineTotal.toFixed(2)}</span>
        <button class="rtg-shop-remove-btn">✕</button>
      </div>
    `;

    const minusBtn = row.querySelector('[data-delta="-1"]');
    const plusBtn = row.querySelector('[data-delta="1"]');
    const removeBtn = row.querySelector(".rtg-shop-remove-btn");

    minusBtn.onclick = () => changeQty(idx, -1);
    plusBtn.onclick = () => changeQty(idx, 1);
    removeBtn.onclick = () => removeFromCart(idx);

    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = total.toFixed(2);
  cartCountEl.textContent = count;
}

/* ============================================================
   CART DRAWER TOGGLE
============================================================ */
function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("visible");
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("visible");
}

cartButton.onclick = openCart;
closeCart.onclick = closeCartDrawer;
cartOverlay.onclick = closeCartDrawer;

/* ============================================================
   LOGO UPLOAD (OPTIONAL)
============================================================ */
logoFileInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) {
    logoDataUrl = null;
    logoPreview.style.backgroundImage = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    logoDataUrl = reader.result;
    logoPreview.style.backgroundImage = `url('${logoDataUrl}')`;
  };
  reader.readAsDataURL(file);
};

/* ============================================================
   CHECKOUT FLOW
============================================================ */
checkoutButton.onclick = () => {
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }
  checkoutModal.classList.remove("hidden");
};

cancelCheckout.onclick = () => {
  checkoutModal.classList.add("hidden");
};

confirmCheckout.onclick = async () => {
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const name = custName.value.trim();
  const email = custEmail.value.trim();
  const phone = custPhone.value.trim();
  const address = custAddress.value.trim();

  if (!name || !email || !address) {
    alert("Name, email, and address are required.");
    return;
  }

  // Build payload for backend
  const payload = {
    customer: {
      name,
      email,
      phone,
      address
    },
    items: cart.map(item => ({
      product_id: item.product.id,
      external_id: item.product.external_id || null,
      qty: item.qty,
      allow_logo: !!item.product.allow_logo
    })),
    logoDataUrl // may be null
  };

  try {
    const res = await fetch("/api/printful/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Order error:", text);
      alert("There was an issue placing your order. Please try again.");
      return;
    }

    const data = await res.json();
    console.log("Order created:", data);

    alert("Order placed successfully! You’ll receive an email shortly.");
    cart = [];
    updateCartUI();
    checkoutModal.classList.add("hidden");
    closeCartDrawer();
  } catch (err) {
    console.error(err);
    alert("Network error placing order.");
  }
};

/* ============================================================
   INIT
============================================================ */
loadProducts();
