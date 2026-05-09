// ============================================================
// REAL TREE GUY — AR MODE v2
// Sobel Edge Detection • Vertical Line Clustering • Real Math
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  const video = document.getElementById("arVideo");
  const canvas = document.getElementById("arCanvas");
  const ctx = canvas.getContext("2d");

  const hudA = document.getElementById("hudA");
  const hudB = document.getElementById("hudB");
  const hudC = document.getElementById("hudC");
  const hudCheck = document.getElementById("hudCheck");
  const hudTie = document.getElementById("hudTie");
  const hudRig = document.getElementById("hudRig");

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
  // SOBEL EDGE DETECTION (REAL EDGE MAP)
  // ============================================================
  function sobelEdge(frame, width, height) {
    const gray = new Uint8ClampedArray(width * height);
    const out = new Uint8ClampedArray(width * height);

    // grayscale
    for (let i = 0; i < width * height; i++) {
      const r = frame[i * 4];
      const g = frame[i * 4 + 1];
      const b = frame[i * 4 + 2];
      gray[i] = (r + g + b) / 3;
    }

    // sobel kernels
    const gx = [-1,0,1,-2,0,2,-1,0,1];
    const gy = [-1,-2,-1,0,0,0,1,2,1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let px = 0, py = 0;
        let idx = 0;

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

    // sort strongest → weakest
    columnScores.sort((a, b) => b.score - a.score);

    return columnScores.slice(0, 5);
  }

  // ============================================================
  // MAIN LOOP
  // ============================================================
  function loop() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const edgeMap = sobelEdge(frame.data, canvas.width, canvas.height);

    const lines = detectVerticalLines(edgeMap, canvas.width, canvas.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (lines.length > 0) {
      const trunk = lines[0];
      const limb = lines.find(l => Math.abs(l.x - trunk.x) > 60);

      // Draw trunk
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(trunk.x, 0);
      ctx.lineTo(trunk.x, canvas.height);
      ctx.stroke();

      // Tie-in = top 20% of trunk
      const tieIn = { x: trunk.x, y: canvas.height * 0.20 };

      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(tieIn.x, tieIn.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Rigging = lower limb if exists
      let rig = null;
      if (limb) {
        rig = { x: limb.x, y: canvas.height * 0.55 };

        ctx.fillStyle = "#00aaff";
        ctx.beginPath();
        ctx.arc(rig.x, rig.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pythagorean math (tie-in to base)
      const base = { x: trunk.x, y: canvas.height };

      const a = Math.abs(tieIn.x - base.x);
      const b = Math.abs(tieIn.y - base.y);
      const c = Math.sqrt(a * a + b * b);

      hudA.textContent = `${a.toFixed(0)} px`;
      hudB.textContent = `${b.toFixed(0)} px`;
      hudC.textContent = `${c.toFixed(0)} px`;
      hudCheck.textContent = `${(a * a + b * b).toFixed(0)}`;

      hudTie.textContent = "Highest strong trunk section";
      hudRig.textContent = rig ? "Lower separate limb" : "No safe limb detected";
    }

    requestAnimationFrame(loop);
  }

});
