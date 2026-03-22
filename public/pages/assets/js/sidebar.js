// ============================================================
// REAL TREE GUY OS — SIDEBAR MODULE
// ============================================================

// inject sidebar HTML
const sidemenu = document.getElementById("rtgSidemenu");

sidemenu.innerHTML = `
  <a href="../pages/profile.html">Profile</a>
  <a href="../pages/customers.html">Customers & Jobs</a>
  <a href="../pages/flyers.html">Cards & Flyers</a>
  <a href="../pages/contracts.html">Contracts</a>
  <a href="../pages/measurement.html">Tree Measurement</a>
  <a href="../pages/calendar.html">Calendar</a>
  <a href="../pages/map.html">RTG Map</a>

  <div class="menu-section-title">How to Use This App</div>

  <details>
    <summary>Saving Customers</summary>
    <p>Store customer names, phone numbers, addresses, and notes. Each customer can have multiple jobs attached.</p>
  </details>

  <details>
    <summary>Creating Jobs</summary>
    <p>Track estimates, scheduled work, completed jobs, and follow‑ups. Everything saves offline.</p>
  </details>

  <details>
    <summary>Using Tree Measurement</summary>
    <p>Measure tree height using your phone’s camera and angle. Helps you quote accurately.</p>
  </details>

  <details>
    <summary>Making Flyers</summary>
    <p>Create printable cards, door hangers, and flyers for marketing.</p>
  </details>

  <details>
    <summary>Contracts</summary>
    <p>Generate simple work agreements. Save or email them instantly.</p>
  </details>

  <details>
    <summary>Calendar</summary>
    <p>Schedule jobs, reminders, and follow‑ups. Everything is stored locally.</p>
  </details>

  <details>
    <summary>RTG Map</summary>
    <p>Find supply stores, dump sites, sawmills, gas stations, and more.</p>
  </details>

  <div class="rtg-online-bottom">
    <a class="rtg-online-btn" id="rtgOnlineBottom">RTG ONLINE</a>
  </div>
`;

// burger logic
const burger = document.getElementById("rtgBurger");

burger.addEventListener("click", () => {
  sidemenu.classList.toggle("open");
});

// dropdown logic
sidemenu.querySelectorAll("details").forEach(d => {
  d.addEventListener("toggle", () => {
    const s = d.querySelector("summary");
    if (d.open) s.classList.add("active");
    else s.classList.remove("active");
  });
});
