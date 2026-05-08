// ============================================================
// REAL TREE GUY — AR MEASUREMENT OVERLAY (TAP-BASED)
// Pythagorean HUD + Tie-In / Rigging Suggestion (visual aid only)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // MODE SWITCHING
  // =========================
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

  // =========================
  // CLASSIC FORM SAVES
  // =========================
  const MEASURE_KEY = "rtgMeasurement";

  function saveMeasurement(partial) {
    const existing = JSON.parse(localStorage.getItem(MEASURE_KEY)) || {};
    const updated = { ...existing, ...partial, updatedAt: new Date().toISOString() };
    localStorage.setItem(MEASURE_KEY, JSON.stringify(updated));
  }

  const heightInput = document.getElementById("heightInput");
  const diameterInput = document.getElementById("diameterInput");
  const distanceInput = document.getElementById("distanceInput");
  const notesInput = document.getElementById("notesInput");

  document.getElementById("saveHeight").addEventListener("click", () => {
    if (!heightInput.value) return;
    saveMeasurement({ heightFt: Number(heightInput.value) });
  });

  document.getElementById("saveDiameter").addEventListener("click", () => {
    if (!diameterInput.value) return;
    saveMeasurement({ diameterIn: Number(diameterInput.value) });
  });

  document.getElementById("saveDistance").addEventListener("click", () => {
    if (!distanceInput.value) return;
    saveMeasurement({ distanceFt: Number(distanceInput.value) });
  });

  document.getElementById("saveNotes").addEventListener("click", () => {
    const val = notesInput.value.trim();
    if (!val) return;
    saveMeasurement({ notes: val });
  });

  // =========================
  // PHOTO CAPTURE (from forms mode)
  // =========================
  const captureBtn = document.getElementById("captureFrame");
  const gallery = document.getElementById("photoGallery");
  const video = document.getElementById("measureVideo"); // same video used in AR
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  if (captureBtn) {
    captureBtn.addEventListener("click", () => {
      if (!video || !video.videoWidth) return;
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      tempCtx.drawImage(video, 0, 0);
      const img = document.createElement("img");
      img.src = tempCanvas.toDataURL("image/png");
      img.className = "rtg-photo-thumb";
      if (gallery) gallery.appendChild(img);
    });
  }

  // =========================
  // AR CAMERA + FULLSCREEN
  // =========================
  const arContainer = document.getElementById("arContainer");
  const canvas = document.getElementById("measureCanvas");
  const ctx = canvas.getContext("2d");
  const enterFullscreenBtn = document.getElementById("enterFullscreen");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        resizeCanvas();
        drawLoop();
      });
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  function resizeCanvas() {
    const rect = arContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  window.addEventListener("resize", resizeCanvas);

  if (enterFullscreenBtn) {
    enterFullscreenBtn.addEventListener("click", () => {
      if (arContainer.requestFullscreen) {
        arContainer.requestFullscreen();
      }
      resizeCanvas();
    });
  }

  startCamera();

  // =========================
  // TAP-BASED POINTS
  // basePoint, tieInPoint, rigPoint in canvas coords
  // =========================
  let basePoint = null;
  let tieInPoint = null;
  let rigPoint = null;

  function canvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left);
    const y = (evt.clientY - rect.top);
    return { x, y };
  }

  canvas.addEventListener("click", (evt) => {
    const pt = canvasCoords(evt);

    if (!basePoint) {
      basePoint = pt;
    } else if (!tieInPoint) {
      tieInPoint = pt;
    } else if (!rigPoint) {
      rigPoint = pt;
    } else {
      // reset cycle
      basePoint = pt;
      tieInPoint = null;
      rigPoint = null;
    }
  });

  // =========================
  // HUD ELEMENTS
  // =========================
  const hudA = document.getElementById("hudA");
  const hudB = document.getElementById("hudB");
  const hudC = document.getElementById("hudC");
  const hudCheck = document.getElementById("hudCheck");
  const hudTieIn = document.getElementById("hudTieIn");
  const hudRig = document.getElementById("hudRig");

  function dist(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // =========================
  // RIGGING SUGGESTION (HEURISTIC, VISUAL ONLY)
  // =========================
  function computeRiggingSuggestion() {
    if (!basePoint || !tieInPoint) return { tieText: "--", rigText: "--" };

    // Higher y on screen is visually "up", but in canvas y grows downward.
    // So "higher" in tree = smaller y value.
    const tieHeight = basePoint.y - tieInPoint.y;

    let rigText = "--";

    if (rigPoint) {
      const rigHeight = basePoint.y - rigPoint.y;

      // simple rule: rigging should be below tie-in, not on same limb (horizontal offset)
      const verticalOK = rigHeight < tieHeight;
      const horizontalOffset = Math.abs(rigPoint.x - tieInPoint.x);
      const horizontalOK = horizontalOffset > 40; // pixels threshold

      if (verticalOK && horizontalOK) {
        rigText = "OK (below tie‑in, different limb)";
      } else if (!verticalOK) {
        rigText = "Too high / same level as tie‑in";
      } else if (!horizontalOK) {
        rigText = "Too close to tie‑in limb";
      }
    }

    const tieText = tieHeight > 0 ? "High on stem" : "Check placement";

    return { tieText, rigText };
  }

  // =========================
  // DRAW LOOP
  // =========================
  function drawLoop() {
    if (!canvas.width || !canvas.height) {
      requestAnimationFrame(drawLoop);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw points
    if (basePoint) {
      drawPoint(basePoint, "#ff7a00"); // base
    }
    if (tieInPoint) {
      drawPoint(tieInPoint, "#00ff88"); // tie-in
    }
    if (rigPoint) {
      drawPoint(rigPoint, "#00aaff"); // rigging
    }

    // Draw triangle + math if base and tie-in exist
    if (basePoint && tieInPoint) {
      const a = Math.abs(tieInPoint.x - basePoint.x); // horizontal
      const b = Math.abs(tieInPoint.y - basePoint.y); // vertical
      const c = Math.sqrt(a * a + b * b);

      // triangle
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(basePoint.x, basePoint.y);
      ctx.lineTo(tieInPoint.x, basePoint.y);
      ctx.lineTo(tieInPoint.x, tieInPoint.y);
      ctx.closePath();
      ctx.stroke();

      // labels
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "white";
      ctx.font = "18px system-ui";

      ctx.fillText(`a = ${a.toFixed(0)} px`, (basePoint.x + tieInPoint.x) / 2, basePoint.y - 8);
      ctx.fillText(`b = ${b.toFixed(0)} px`, tieInPoint.x + 6, (basePoint.y + tieInPoint.y) / 2);
      ctx.fillText(`c = ${c.toFixed(0)} px`, (basePoint.x + tieInPoint.x) / 2, (basePoint.y + tieInPoint.y) / 2);

      // HUD math
      if (hudA) hudA.textContent = a.toFixed(0) + " px";
      if (hudB) hudB.textContent = b.toFixed(0) + " px";
      if (hudC) hudC.textContent = c.toFixed(0) + " px";

      const lhs = a * a + b * b;
      const rhs = c * c;
      const diff = Math.abs(lhs - rhs);
      if (hudCheck) hudCheck.textContent = `|${lhs.toFixed(0)} - ${rhs.toFixed(0)}| = ${diff.toFixed(0)}`;
    } else {
      if (hudA) hudA.textContent = "--";
      if (hudB) hudB.textContent = "--";
      if (hudC) hudC.textContent = "--";
      if (hudCheck) hudCheck.textContent = "--";
    }

    // Rigging suggestion
    const { tieText, rigText } = computeRiggingSuggestion();
    if (hudTieIn) hudTieIn.textContent = tieText;
    if (hudRig) hudRig.textContent = rigText;

    requestAnimationFrame(drawLoop);
  }

  function drawPoint(p, color) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
});
