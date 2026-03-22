// ============================================================
// REAL TREE GUY OS — DASHBOARD MODULE
// ============================================================

// tree buttons
document.querySelectorAll(".branch-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const href = btn.getAttribute("href");
    if (href) window.location.href = href;
  });
});

// bottom RTG MAP button
const rtgMapBottom = document.getElementById("rtgMapBottom");
if (rtgMapBottom) {
  rtgMapBottom.addEventListener("click", () => {
    window.location.href = "../pages/map.html";
  });
}
