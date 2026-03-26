// REAL TREE GUY OS — SIDEBAR / BURGER MENU

const $ = id => document.getElementById(id);

const burger = $("rtgBurger");
const sidemenu = $("rtgSidemenu");

if (burger && sidemenu) {
  burger.addEventListener("click", () => {
    sidemenu.classList.toggle("open");
  });

  sidemenu.innerHTML = `
    <div class="nav-item">
      <button class="nav-main">
        <span class="nav-title">Profile</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc">Manage your Real Tree Guy business profile and core info.</div>
      <a href="/pages/profile.html" class="nav-leaf">Go to Profile</a>
    </div>

    <div class="nav-item">
      <button class="nav-main">
        <span class="nav-title">Customers & Jobs</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc">Track customers, quotes, and scheduled jobs.</div>
      <a href="/pages/customers.html" class="nav-leaf">Go to Customers & Jobs</a>
    </div>

    <div class="nav-item">
      <button class="nav-main">
        <span class="nav-title">Cards & Flyers</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc">Design print‑ready cards, flyers, and door hangers.</div>
      <a href="/pages/flyers.html" class="nav-leaf">Go to Cards & Flyers</a>
    </div>

    <div class="nav-item">
      <button class="nav-main">
        <span class="nav-title">Contracts</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc">Build and export job contracts for your clients.</div>
      <a href="/pages/contracts.html" class="nav-leaf">Go to Contracts</a>
    </div>

    <div class="nav-item">
      <button class="nav-main">
        <span class="nav-title">Tree Measurement</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc">Measure trees and log important job details.</div>
      <a href="/pages/measurement.html" class="nav-leaf">Go to Tree Measurement</a>
    </div>

    <div class="nav-item">
      <button class="nav-main">
        <span class="nav-title">Calendar</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc">See your schedule and upcoming jobs.</div>
      <a href="/pages/calendar.html" class="nav-leaf">Go to Calendar</a>
    </div>

    <div class="nav-item">
      <button class="nav-main">
        <span class="nav-title">RTG Map</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc">View RTG Map for live job locations and routing.</div>
      <a href="/pages/map.html" class="nav-leaf">Go to RTG Map</a>
    </div>

    <div class="nav-divider"></div>

    <div class="nav-item nav-special">
      <button class="nav-main">
        <span class="nav-title nav-title-orange">REAL TREE SHOP</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc nav-desc-orange">
        Your gear, tools, and merch hub for Real Tree Guy operations.
      </div>
      <a href="/pages/real-tree-shop.html" class="nav-leaf">Open Real Tree Shop</a>
    </div>

    <div class="nav-item nav-special">
      <button class="nav-main">
        <span class="nav-title nav-title-orange">RTG ONLINE</span>
        <span class="arrow">▾</span>
      </button>
      <div class="nav-desc nav-desc-orange">
        RTG Online portal for digital services, updates, and online tools.
      </div>
      <a href="/pages/rtg-online.html" class="nav-leaf">Go to RTG Online</a>
    </div>
  `;

  sidemenu.addEventListener("click", e => {
    const main = e.target.closest(".nav-main");
    if (!main) return;
    const item = main.closest(".nav-item");
    if (!item) return;
    item.classList.toggle("open");
  });
}
