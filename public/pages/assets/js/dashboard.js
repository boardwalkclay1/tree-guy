// /assets/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  // CLOCK
  const clockEl = document.getElementById("rtgClock");
  function updateClock() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // SIDEBAR TOGGLE
  const burger = document.getElementById("rtgBurger");
  const sidemenu = document.getElementById("rtgSidemenu");

  if (burger && sidemenu) {
    burger.addEventListener("click", () => {
      sidemenu.classList.toggle("open");
    });
  }
});
