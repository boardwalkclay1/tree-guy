// ============================================================
// REAL TREE GUY OS — SIDEBAR MODULE (REBUILT CLEAN)
// ============================================================

const sidemenu = document.getElementById("rtgSidemenu");

sidemenu.innerHTML = `

  <!-- MAIN DROPDOWN -->
  <details class="rtg-master">
    <summary class="rtg-master-title">App Pages</summary>

    <!-- PROFILE -->
    <div class="rtg-item">
      <span class="rtg-label">Profile</span>
      <button class="enter-btn" onclick="location.href='../pages/profile.html'">Enter</button>
      <p class="rtg-desc">Store your company name, logo, phone number, and details used across the OS.</p>
    </div>

    <!-- CUSTOMERS -->
    <div class="rtg-item">
      <span class="rtg-label">Customers & Jobs</span>
      <button class="enter-btn" onclick="location.href='../pages/customers.html'">Enter</button>
      <p class="rtg-desc">Save customers, attach jobs, track estimates, completed work, and follow‑ups.</p>
    </div>

    <!-- FLYERS -->
    <div class="rtg-item">
      <span class="rtg-label">Cards & Flyers</span>
      <button class="enter-btn" onclick="location.href='../pages/flyers.html'">Enter</button>
      <p class="rtg-desc">Create business cards, flyers, and door hangers for marketing.</p>
    </div>

    <!-- CONTRACTS -->
    <div class="rtg-item">
      <span class="rtg-label">Contracts</span>
      <button class="enter-btn" onclick="location.href='../pages/contracts.html'">Enter</button>
      <p class="rtg-desc">Generate simple work agreements you can save or send instantly.</p>
    </div>

    <!-- MEASUREMENT -->
    <div class="rtg-item">
      <span class="rtg-label">Tree Measurement</span>
      <button class="enter-btn" onclick="location.href='../pages/measurement.html'">Enter</button>
      <p class="rtg-desc">Measure tree height using your phone’s camera and angle.</p>
    </div>

    <!-- CALENDAR -->
    <div class="rtg-item">
      <span class="rtg-label">Calendar</span>
      <button class="enter-btn" onclick="location.href='../pages/calendar.html'">Enter</button>
      <p class="rtg-desc">Schedule jobs, reminders, and follow‑ups. Everything saves offline.</p>
    </div>

    <!-- MAP -->
    <div class="rtg-item">
      <span class="rtg-label">RTG Map</span>
      <button class="enter-btn" onclick="location.href='../pages/map.html'">Enter</button>
      <p class="rtg-desc">Find supply stores, dump sites, sawmills, gas stations, and more.</p>
    </div>

  </details>

  <!-- RTG ONLINE BUTTON -->
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
// RTG ONLINE — COMING SOON POPUP
// ============================================================
document.getElementById("rtgOnlineBottom").addEventListener("click", () => {
  alert("RTG ONLINE — Coming Soon");
});
