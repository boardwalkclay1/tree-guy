// CLOCK
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("rtgClock");
  if (!clockEl) return;
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
setInterval(updateClock, 1000);
updateClock();

// SIDEBAR DROPDOWNS
document.querySelectorAll(".rtg-menu-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.parentElement.classList.toggle("open");
  });
});

// BURGER + SIDEBAR TOGGLE
const burger = document.getElementById("rtgBurger");
const menu = document.getElementById("rtgSidemenu");

if (burger && menu) {
  burger.addEventListener("click", () => {
    menu.classList.toggle("open");
    burger.classList.toggle("open");
  });
}
