// ============================================================
// Real Tree Guy OS — Dashboard JS
// ============================================================

// SIDEMENU
const burger = document.getElementById("rtgBurger");
const sidemenu = document.getElementById("rtgSidemenu");

burger.onclick = () => {
  sidemenu.classList.toggle("open");
};

// RTG ONLINE BUTTON
const rtgOnline = document.getElementById("rtgOnlineBottom");
if (rtgOnline) {
  rtgOnline.onclick = () => {
    alert("RTG Online is coming soon.");
  };
}
