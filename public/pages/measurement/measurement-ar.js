// ============================================================
// REAL TREE GUY — AR ENGINE (UNIFIED v3)
// Vision • ML Hooks • Physics • Rigging • Reasoning
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ------------------------------------------------------------
  // DOM HOOKS
  // ------------------------------------------------------------
  const video = document.getElementById("arVideo");
  const canvas = document.getElementById("arCanvas");
  const ctx = canvas.getContext("2d");

  const hudA = document.getElementById("hudA");
  const hudB = document.getElementById("hudB");
  const hudC = document.getElementById("hudC");
  const hudCheck = document.getElementById("hudCheck");
  const hudTie = document.getElementById("hudTie");
  const hudRig = document.getElementById("hudRig");
  const hudHazard = document.getElementById("hudHazard");

  // ============================================================
  // CAMERA START
  // ============================================================
  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      loop();
    });
  }

  startCamera();

  // ============================================================
  // SOBEL EDGE DETECTION
  // ============================================================
  function sobelEdge(frame, width, height) {
    const gray = new Uint8ClampedArray(width * height);
    const out = new Uint8ClampedArray(width * height);

    for (let i = 0; i < width * height; i++) {
      const r = frame[i * 4];
      const g = frame[i * 4 + 1];
      const b = frame[i * 4 + 2];
      gray[i] = (r + g + b) / 3;
    }

    const gx = [-1,0,1,-2,0,2,-1,0,1];
    const gy = [-1,-2,-1,0,0,0,1,2,1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let px = 0, py = 0, idx = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const val = gray[(y + ky) * width + (x + kx)];
            px += val * gx[idx];
            py += val * gy[idx];
            idx++;
          }
        }

        const mag = Math.sqrt(px * px + py * py);
        out[y * width + x] = mag > 80 ? 255 : 0;
      }
    }

    return out;
  }

  // ============================================================
  // VERTICAL LINE CLUSTERING
  // ============================================================
  function detectVerticalLines(edgeMap, width, height) {
    const columnScores = [];

    for (let x = 0; x < width; x += 4) {
      let score = 0;
      for (let y = 0; y < height; y += 4) {
        if (edgeMap[y * width + x] === 255) score++;
      }
      columnScores.push({ x, score });
    }

    columnScores.sort((a, b) => b.score - a.score);
    return columnScores.slice(0, 6);
  }

  // ============================================================
  // ML HOOKS (FUTURE READY)
  // ============================================================
  const ML = {
    modelLoaded: false,
    model: null,

    async load() {
      // Example:
      // this.model = await tf.loadGraphModel("model-url");
      this.modelLoaded = false;
    },

    async analyze(frame, width, height) {
      if (!this.modelLoaded) return null;
      return null;
    }
  };

  ML.load();

  // ============================================================
  // PHYSICS LAYER
  // ============================================================
  const Physics = {
    distance(p1, p2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

    leanAngle(trunkX, width) {
      const center = width / 2;
      const dx = trunkX - center;
      const max = width / 2;
      return (dx / max) * 30; // ±30° lean
    },

    riggingLoadScore(tieIn, rig, base) {
      const span = this.distance(tieIn, rig || base);
      const height = this.distance(tieIn, base);
      const angleFactor = rig ? Math.abs(rig.x - tieIn.x) / (span || 1) : 0.3;
      let score = (height * 0.4 + span * 0.6) * angleFactor;
      return Math.min(100, Math.max(0, Math.round(score / 10)));
    }
  };

  // ============================================================
  // REASONING LAYER
  // ============================================================
  const Reasoning = {
    hazardScore({ leanDeg, loadScore, hasRig, hasSeparateLimb }) {
      let score = 0;

      score += loadScore * 0.6;
      score += Math.min(30, Math.abs(leanDeg)) * 1.0;
      if (!hasRig) score += 20;
      if (!hasSeparateLimb) score += 15;

      return Math.min(100, Math.max(0, Math.round(score)));
    },

    hazardLabel(score) {
      if (score < 30) return "Low";
      if (score < 60) return "Moderate";
      if (score < 80) return "High";
      return "Severe";
    }
  };

  // ============================================================
  // MAIN LOOP
  // ============================================================
  function loop() {
    if (!video.videoWidth) {
      requestAnimationFrame(loop);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const edgeMap = sobelEdge(frame.data, canvas.width, canvas.height);
    const lines = detectVerticalLines(edgeMap, canvas.width, canvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (lines.length > 0) {
      const trunk = lines[0];
      const limb = lines.find(l => Math.abs(l.x - trunk.x) > 60) || null;

      // Draw trunk
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(trunk.x, 0);
      ctx.lineTo(trunk.x, canvas.height);
      ctx.stroke();

      // Tie-in
      const tieIn = { x: trunk.x, y: canvas.height * 0.2 };
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(tieIn.x, tieIn.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Rigging
      let rig = null;
      let hasSeparateLimb = false;

      if (limb) {
        hasSeparateLimb = true;
        rig = { x: limb.x, y: canvas.height * 0.55 };

        ctx.fillStyle = "#00aaff";
        ctx.beginPath();
        ctx.arc(rig.x, rig.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      const base = { x: trunk.x, y: canvas.height };

      // Pythagorean math
      const a = Math.abs(tieIn.x - base.x);
      const b = Math.abs(tieIn.y - base.y);
      const c = Physics.distance(tieIn, base);

      hudA.textContent = `${a.toFixed(0)} px`;
      hudB.textContent = `${b.toFixed(0)} px`;
      hudC.textContent = `${c.toFixed(0)} px`;
      hudCheck.textContent = `${(a * a + b * b).toFixed(0)}`;

      hudTie.textContent = "Tie-in: top strong trunk section";
      hudRig.textContent = rig ? "Rigging: lower separate limb" : "Rigging: no safe limb detected";

      // Physics + reasoning
      const leanDeg = Physics.leanAngle(trunk.x, canvas.width);
      const loadScore = Physics.riggingLoadScore(tieIn, rig, base);
      const hazardScore = Reasoning.hazardScore({
        leanDeg,
        loadScore,
        hasRig: !!rig,
        hasSeparateLimb
      });
      const label = Reasoning.hazardLabel(hazardScore);

      if (hudHazard) hudHazard.textContent = `Hazard: ${label} (${hazardScore})`;
    }

    requestAnimationFrame(loop);
  }

});
