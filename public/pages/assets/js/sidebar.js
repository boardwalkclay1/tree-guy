// ============================================================
// REAL TREE GUY OS — SIDEBAR MODULE (FINAL VERSION)
// ============================================================

const sidemenu = document.getElementById("rtgSidemenu");

sidemenu.innerHTML = `

  <!-- PROFILE -->
  <details class="rtg-item">
    <summary class="rtg-label">Profile</summary>
    <div class="rtg-drop">
      <p>Store your company name, logo, phone number, and details used across the OS.</p>
      <button class="enter-btn" onclick="location.href='../pages/profile.html'">ENTER</button>
    </div>
  </details>

  <!-- CUSTOMERS -->
  <details class="rtg-item">
    <summary class="rtg-label">Customers & Jobs</summary>
    <div class="rtg-drop">
      <p>Save customers, attach jobs, track estimates, completed work, and follow‑ups.</p>
      <button class="enter-btn" onclick="location.href='../pages/customers.html'">ENTER</button>
    </div>
  </details>

  <!-- FLYERS -->
  <details class="rtg-item">
    <summary class="rtg-label">Cards & Flyers</summary>
    <div class="rtg-drop">
      <p>Create business cards, flyers, and door hangers for marketing.</p>
      <button class="enter-btn" onclick="location.href='../pages/flyers.html'">ENTER</button>
    </div>
  </details>

  <!-- CONTRACTS -->
  <details class="rtg-item">
    <summary class="rtg-label">Contracts</summary>
    <div class="rtg-drop">
      <p>Generate simple work agreements you can save or send instantly.</p>
      <button class="enter-btn" onclick="location.href='../pages/contracts.html'">ENTER</button>
    </div>
  </details>

  <!-- MEASUREMENT -->
  <details class="rtg-item">
    <summary class="rtg-label">Tree Measurement</summary>
    <div class="rtg-drop">
      <p>Measure tree height using your phone’s camera and angle.</p>
      <button class="enter-btn" onclick="location.href='../pages/measurement.html'">ENTER</button>
    </div>
  </details>

  <!-- CALENDAR -->
  <details class="rtg-item">
    <summary class="rtg-label">Calendar</summary>
    <div class="rtg-drop">
      <p>Schedule jobs, reminders, and follow‑ups. Everything saves offline.</p>
      <button class="enter-btn" onclick="location.href='../pages/calendar.html'">ENTER</button>
    </div>
  </details>

  <!-- MAP -->
  <details class="rtg-item">
    <summary class="rtg-label">RTG Map</summary>
    <div class="rtg-drop">
      <p>Find supply stores, dump sites, sawmills, gas stations, and more.</p>
      <button class="enter-btn" onclick="location.href='../pages/map.html'">ENTER</button>
    </div>
  </details>

  <!-- RTG ONLINE -->
  <div class="rtg-online-bottom">
    <button class="rtg-online-btn" id="rtgOnlineBottom">RTG ONLINE</button>
  </div>
`;

// ============================================================
// BURGER LOGIC
// ============================================================
const burger = document.getElementById("rtgBurger");
burger.addEventListener("click", () => {
  sidemenu.classList.toggle("open");
});

// ============================================================
// RTG ONLINE — COMING SOON
// ============================================================
document.getElementById("rtgOnlineBottom").addEventListener("click", () => {
  alert("RTG ONLINE — Coming Soon");
});
