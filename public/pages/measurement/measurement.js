// ============================================================
// REAL TREE GUY — MEASUREMENT TOOLS
// Modes • Camera First • Simple Saves
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // MODE SWITCHING
  const modeButtons = document.querySelectorAll(".mode-btn");
  const panels = document.querySelectorAll(".rtg-mode-panel");

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;

      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      panels.forEach(p => {
        p.classList.toggle("active", p.id === `mode-${mode}`);
      });
    });
  });

  // CAMERA
  const video = document.getElementById("measureVideo");
  const canvas = document.getElementById("measureCanvas");
  const captureBtn = document.getElementById("captureFrame");
  const gallery = document.getElementById("photoGallery");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  // Start camera immediately
  startCamera();

  // Capture frame
  captureBtn.addEventListener("click", () => {
    if (!video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.className = "rtg-photo-thumb";

    if (gallery) gallery.appendChild(img);
  });

  // SIMPLE SAVES (localStorage)
  const MEASURE_KEY = "rtgMeasurement";

  function saveMeasurement(partial) {
    const existing = JSON.parse(localStorage.getItem(MEASURE_KEY)) || {};
    const updated = { ...existing, ...partial, updatedAt: new Date().toISOString() };
    localStorage.setItem(MEASURE_KEY, JSON.stringify(updated));
  }

  document.getElementById("saveHeight").addEventListener("click", () => {
    const val = document.getElementById("heightInput").value;
    if (!val) return;
    saveMeasurement({ heightFt: Number(val) });
  });

  document.getElementById("saveDiameter").addEventListener("click", () => {
    const val = document.getElementById("diameterInput").value;
    if (!val) return;
    saveMeasurement({ diameterIn: Number(val) });
  });

  document.getElementById("saveDistance").addEventListener("click", () => {
    const val = document.getElementById("distanceInput").value;
    if (!val) return;
    saveMeasurement({ distanceFt: Number(val) });
  });

  document.getElementById("saveNotes").addEventListener("click", () => {
    const val = document.getElementById("notesInput").value.trim();
    if (!val) return;
    saveMeasurement({ notes: val });
  });
});
