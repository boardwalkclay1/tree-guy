// CLOCK
function updateClock() {
  const now = new Date();
  document.getElementById("rtgClock").textContent =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

// SIDEBAR
const burger = document.getElementById("rtgBurger");
const sidemenu = document.getElementById("rtgSidemenu");

burger.addEventListener("click", () => {
  sidemenu.classList.toggle("open");
});
