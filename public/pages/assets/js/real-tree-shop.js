// /assets/js/real-tree-shop.js

const SHOP_JSON_URL = "/assets/data/real-tree-shop.json";

let shopData = null;
let filteredCategory = null;
let searchTerm = "";
let cart = [];

const categoryListEl = document.getElementById("categoryList");
const productGridEl = document.getElementById("productGrid");
const currentCategoryLabelEl = document.getElementById("currentCategoryLabel");
const productSearchEl = document.getElementById("productSearch");

const cartButtonEl = document.getElementById("cartButton");
const cartCountEl = document.getElementById("cartCount");
const cartDrawerEl = document.getElementById("cartDrawer");
const cartOverlayEl = document.getElementById("cartOverlay");
const closeCartEl = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const checkoutButtonEl = document.getElementById("checkoutButton");

async function loadShopData() {
  const res = await fetch(SHOP_JSON_URL, { cache: "no-store" });
  shopData = await res.json();
  renderCategories();
  renderProducts();
}

function renderCategories() {
  if (!shopData) return;
  categoryListEl.innerHTML = "";

  const allLi = document.createElement("li");
  const allBtn = document.createElement("button");
  allBtn.textContent = "All Products";
  allBtn.className = "rtg-shop-category-btn active";
  allBtn.dataset.categoryId = "";
  allBtn.addEventListener("click", () => {
    filteredCategory = null;
    updateCategoryButtons("");
    currentCategoryLabelEl.textContent = "All Products";
    renderProducts();
  });
  allLi.appendChild(allBtn);
  categoryListEl.appendChild(allLi);

  shopData.categories.forEach(cat => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = cat.name;
    btn.className = "rtg-shop-category-btn";
    btn.dataset.categoryId = cat.id;
    btn.addEventListener("click", () => {
      filteredCategory = cat.id;
      updateCategoryButtons(cat.id);
      currentCategoryLabelEl.textContent = cat.name;
      renderProducts();
    });
    li.appendChild(btn);
    categoryListEl.appendChild(li);
  });
}

function updateCategoryButtons(activeId) {
  const buttons = categoryListEl.querySelectorAll(".rtg-shop-category-btn");
  buttons.forEach(btn => {
    if (btn.dataset.categoryId === activeId) {
      btn.classList.add("active");
    } else if (!activeId && btn.dataset.categoryId === "") {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function renderProducts() {
  if (!shopData) return;
  productGridEl.innerHTML = "";

  let products = shopData.products.slice();

  if (filteredCategory) {
    products = products.filter(p => p.category_id === filteredCategory);
  }

  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  }

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "rtg-shop-card";

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;

    const title = document.createElement("div");
    title.className = "rtg-shop-card-title";
    title.textContent = product.name;

    const desc = document.createElement("div");
    desc.className = "rtg-shop-card-desc";
    desc.textContent = product.description || "";

    const price = document.createElement("div");
    price.className = "rtg-shop-card-price";
    price.textContent = `$${product.price.toFixed(2)}`;

    const footer = document.createElement("div");
    footer.className = "rtg-shop-card-footer";

    const vendor = document.createElement("div");
    vendor.className = "rtg-shop-card-vendor";
    vendor.textContent = `Cheapest: ${product.cheapest_vendor.name}`;

    const addBtn = document.createElement("button");
    addBtn.className = "rtg-shop-add-btn";
    addBtn.textContent = "Add to Cart";
    addBtn.addEventListener("click", () => addToCart(product.id));

    footer.appendChild(vendor);
    footer.appendChild(addBtn);

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(price);
    card.appendChild(footer);

    productGridEl.appendChild(card);
  });
}

function addToCart(productId) {
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);
  updateCartUI();
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    updateCartUI();
  }
}

function updateCartUI() {
  cartCountEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

  cartItemsEl.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const product = shopData.products.find(p => p.id === item.productId);
    if (!product) return;

    const row = document.createElement("div");
    row.className = "rtg-shop-cart-item";

    const name = document.createElement("div");
    name.className = "rtg-shop-cart-item-name";
    name.textContent = product.name;

    const qtyWrap = document.createElement("div");
    qtyWrap.className = "rtg-shop-cart-item-qty";

    const minusBtn = document.createElement("button");
    minusBtn.className = "rtg-shop-cart-qty-btn";
    minusBtn.textContent = "−";
    minusBtn.addEventListener("click", () => changeCartQty(product.id, -1));

    const qtyText = document.createElement("span");
    qtyText.textContent = item.qty;

    const plusBtn = document.createElement("button");
    plusBtn.className = "rtg-shop-cart-qty-btn";
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", () => changeCartQty(product.id, 1));

    qtyWrap.appendChild(minusBtn);
    qtyWrap.appendChild(qtyText);
    qtyWrap.appendChild(plusBtn);

    const lineTotal = product.price * item.qty;
    total += lineTotal;

    const price = document.createElement("div");
    price.textContent = `$${lineTotal.toFixed(2)}`;

    row.appendChild(name);
    row.appendChild(qtyWrap);
    row.appendChild(price);

    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = total.toFixed(2);
}

function openCart() {
  cartDrawerEl.classList.add("open");
  cartOverlayEl.classList.add("visible");
}

function closeCart() {
  cartDrawerEl.classList.remove("open");
  cartOverlayEl.classList.remove("visible");
}

productSearchEl.addEventListener("input", e => {
  searchTerm = e.target.value || "";
  renderProducts();
});

cartButtonEl.addEventListener("click", openCart);
closeCartEl.addEventListener("click", closeCart);
cartOverlayEl.addEventListener("click", closeCart);

checkoutButtonEl.addEventListener("click", () => {
  if (!cart.length) return;

  const orderPayload = cart.map(item => {
    const product = shopData.products.find(p => p.id === item.productId);
    return {
      product_id: product.id,
      name: product.name,
      qty: item.qty,
      unit_price: product.price,
      cheapest_vendor: product.cheapest_vendor
    };
  });

  console.log("REAL TREE GUY ORDER PAYLOAD:", orderPayload);
  alert("Order captured under Real Tree Guy brand. Wire this payload to your backend or vendor scripts.");
});

loadShopData();
