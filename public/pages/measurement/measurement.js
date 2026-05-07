// ============================================================
// REAL TREE GUY — MEASUREMENT TOOLS (UPGRADED AR VERSION)
// Modes • Camera • Tree Detection • Pythagorean Overlay
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // MODE SWITCHING
  // ============================================================
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

  // ============================================================
  // CAMERA + CANVAS OVERLAY
  // ============================================================
  const video = document.getElementById("measureVideo");
  const canvas = document.getElementById("measureCanvas");
  const ctx = canvas.getContext("2d");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.classList.remove("hidden");
        detectLoop();
      });
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  startCamera();

  // ============================================================
  // LOAD TREE DETECTION MODEL (TensorFlow.js COCO-SSD)
  // ============================================================
  let model = null;

  async function loadModel() {
    model = await cocoSsd.load();
    console.log("Tree detection model loaded");
  }

  loadModel();

  // ============================================================
  // DETECTION + OVERLAY LOOP
  // ============================================================
  async function detectLoop() {
    if (model && video.readyState === 4) {
      const predictions = await model.detect(video);
      drawOverlay(predictions);
    }
    requestAnimationFrame(detectLoop);
  }

  // ============================================================
  // DRAW OVERLAY (TREE REACTIVE)
  // ============================================================
  function drawOverlay(predictions) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find the largest detected tree
    const trees = predictions.filter(p => p.class === "tree");
    if (trees.length === 0) return;

    const tree = trees.sort((a, b) => b.bbox[2] * b.bbox[3] - a.bbox[2] * a.bbox[3])[0];

    const [x, y, w, h] = tree.bbox;

    // Faint overlay style
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineWidth = 2;

    // Draw bounding box
    ctx.strokeRect(x, y, w, h);

    // Draw right triangle on the tree
    const ax = x;
    const ay = y + h;
    const bx = x + w;
    const by = y + h;
    const cx = x;
    const cy = y;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.stroke();

    // Side lengths (pixels)
    const a = Math.round(w);
    const b = Math.round(h);
    const c = Math.round(Math.sqrt(w * w + h * h));

    // Labels
    ctx.font = "22px Arial";
    ctx.fillText(`a = ${a}px`, (ax + bx) / 2, ay - 10);
    ctx.fillText(`b = ${b}px`, ax + 10, (ay + cy) / 2);
    ctx.fillText(`c = ${c}px`, (bx + cx) / 2, (by + cy) / 2);

    // Pythagorean theorem
    ctx.font = "28px Arial";
    ctx.fillText("a² + b² = c²", x, y - 10);
  }

  // ============================================================
  // CAPTURE FRAME
  // ============================================================
  const captureBtn = document.getElementById("captureFrame");
  const gallery = document.getElementById("photoGallery");

  captureBtn.addEventListener("click", () => {
    if (!video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx2 = canvas.getContext("2d");
    ctx2.drawImage(video, 0, 0);

    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.className = "rtg-photo-thumb";

    if (gallery) gallery.appendChild(img);
  });

  // ============================================================
  // SIMPLE SAVES (localStorage)
  // ============================================================
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
