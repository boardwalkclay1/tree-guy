// SIMPLE BURGER MENU TOGGLE FOR STATIC SIDEBAR

const burger = document.getElementById("rtgBurger");
const sidemenu = document.getElementById("rtgSidemenu");

if (burger && sidemenu) {
  burger.addEventListener("click", () => {
    sidemenu.classList.toggle("open");
  });
}
