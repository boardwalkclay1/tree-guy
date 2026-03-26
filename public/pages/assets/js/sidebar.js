// REAL TREE GUY OS — BURGER + SIDEBAR

const $ = id => document.getElementById(id);

const burger = $("rtgBurger");
const sidemenu = $("rtgSidemenu");

// OPEN / CLOSE SIDEBAR
burger.addEventListener("click", () => {
  sidemenu.classList.toggle("open");
});

// SIDEBAR CONTENT
sidemenu.innerHTML = `
  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> Profile <span class="arrow">▾</span></button>
    <div class="nav-desc">Manage your business info.</div>
    <a href="/pages/profile.html" class="nav-leaf">🌿 Go to Profile</a>
  </div>

  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> Customers & Jobs <span class="arrow">▾</span></button>
    <div class="nav-desc">Track customers and jobs.</div>
    <a href="/pages/customers.html" class="nav-leaf">🌿 Go to Customers</a>
  </div>

  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> Cards & Flyers <span class="arrow">▾</span></button>
    <div class="nav-desc">Design flyers and cards.</div>
    <a href="/pages/flyers.html" class="nav-leaf">🌿 Go to Flyers</a>
  </div>

  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> Contracts <span class="arrow">▾</span></button>
    <div class="nav-desc">Create job contracts.</div>
    <a href="/pages/contracts.html" class="nav-leaf">🌿 Go to Contracts</a>
  </div>

  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> Tree Measurement <span class="arrow">▾</span></button>
    <div class="nav-desc">Measure trees accurately.</div>
    <a href="/pages/measurement.html" class="nav-leaf">🌿 Go to Measurement</a>
  </div>

  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> Calendar <span class="arrow">▾</span></button>
    <div class="nav-desc">Schedule jobs.</div>
    <a href="/pages/calendar.html" class="nav-leaf">🌿 Go to Calendar</a>
  </div>

  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> Real Tree Shop <span class="arrow">▾</span></button>
    <div class="nav-desc">Gear and tools for tree work.</div>
    <a href="/pages/real-tree-shop.html" class="nav-leaf">🌿 Go to Shop</a>
  </div>

  <div class="nav-item">
    <button class="nav-main"><span>🌿</span> RTG Map <span class="arrow">▾</span></button>
    <div class="nav-desc">Live GPS map for tree work.</div>
    <a href="/pages/map.html" class="nav-leaf">🌿 Go to RTG Map</a>
  </div>
`;

// DROPDOWN LOGIC
sidemenu.addEventListener("click", e => {
  const main = e.target.closest(".nav-main");
  if (!main) return;
  main.parentElement.classList.toggle("open");
});
      <a href="flyers.html" class="nav-leaf">🌿 Go to Flyers</a>
    </div>

    <div class="nav-item">
      <button class="nav-main"><span>🌿</span> Contracts <span class="arrow">▾</span></button>
      <div class="nav-desc">Create job contracts.</div>
      <a href="contracts.html" class="nav-leaf">🌿 Go to Contracts</a>
    </div>

    <div class="nav-item">
      <button class="nav-main"><span>🌿</span> Tree Measurement <span class="arrow">▾</span></button>
      <div class="nav-desc">Measure trees accurately.</div>
      <a href="measurement.html" class="nav-leaf">🌿 Go to Measurement</a>
    </div>

    <div class="nav-item">
      <button class="nav-main"><span>🌿</span> Calendar <span class="arrow">▾</span></button>
      <div class="nav-desc">Schedule jobs.</div>
      <a href="calendar.html" class="nav-leaf">🌿 Go to Calendar</a>
    </div>

    <div class="nav-item">
      <button class="nav-main"><span>🌿</span> Real Tree Shop <span class="arrow">▾</span></button>
      <div class="nav-desc">Gear and tools for tree work.</div>
      <a href="shop.html" class="nav-leaf">🌿 Go to Shop</a>
    </div>

    <div class="nav-item">
      <button class="nav-main"><span>🌿</span> RTG Map <span class="arrow">▾</span></button>
      <div class="nav-desc">Live GPS map for tree work.</div>
      <a href="map.html" class="nav-leaf">🌿 Go to RTG Map</a>
    </div>
  `;
}

// DROPDOWN LOGIC
if (sidemenu) {
  sidemenu.addEventListener("click", e => {
    const main = e.target.closest(".nav-main");
    if (!main) return;

    const item = main.closest(".nav-item");
    if (!item) return;

    item.classList.toggle("open");
  });
}
