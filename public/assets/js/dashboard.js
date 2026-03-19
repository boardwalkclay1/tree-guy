// SIDEMENU
const burger = document.getElementById("rtgBurger");
const sidemenu = document.getElementById("rtgSidemenu");

burger.onclick = () => {
  sidemenu.classList.toggle("open");
};

// MAP + FILTERS
const map = document.getElementById("rtgMap");
const radiusText = document.getElementById("rtgRadius");
const filterButtons = document.querySelectorAll("#rtg-filters button");

function loadMap(type) {
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const q = encodeURIComponent(type);
    map.src = `https://www.google.com/maps?q=${q}+near+${lat},${lng}&z=13&output=embed`;

    radiusText.textContent = "Searching within ~5 miles of your location.";
  });
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    loadMap(btn.dataset.type);
  });
});
