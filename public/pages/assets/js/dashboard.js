// =========================
// API + AUTH
// =========================
const API = window.API_URL;

  function getToken() {
    return localStorage.getItem("token");
  }

  async function getUser() {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async function requireAuth(redirect = "/treeguy/login.html") {
    const user = await getUser();
    if (!user) window.location.href = redirect;
    return user;
  }

  // =========================
  // HAMBURGER MENU
  // =========================
  const burger = document.getElementById("rtgBurger");
  const sidemenu = document.getElementById("rtgSidemenu");

  burger.addEventListener("click", () => {
    sidemenu.classList.toggle("open");
  });

  // =========================
  // MAP LOGIC
  // =========================
  const dashMap = document.getElementById("rtgMap");
  const dashFilterButtons = document.querySelectorAll("#rtg-filters button");
  const radiusEl = document.getElementById("rtgRadius");

  const DEFAULT_ZOOM = 14;

  function setRadiusText(zoom) {
    let miles = 5;
    if (zoom >= 15) miles = 2;
    if (zoom >= 16) miles = 1;
    radiusEl.textContent = `Searching within ~${miles} miles of your location.`;
  }

  function updateMapWithType(type) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const q = `${type} near ${lat},${lng}`;
        const zoom = DEFAULT_ZOOM;

        dashMap.src =
          `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;

        setRadiusText(zoom);
      },
      () => {
        const q = `${type} near me`;
        const zoom = 13;

        dashMap.src =
          `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;

        radiusEl.textContent =
          "Location denied. Showing results near your device's map region.";
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  // =========================
  // INITIAL LOAD
  // =========================
  await requireAuth();
  updateMapWithType("tree service supplies");

  // =========================
  // FILTER BUTTONS
  // =========================
  dashFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      updateMapWithType(type);
    });
  });
