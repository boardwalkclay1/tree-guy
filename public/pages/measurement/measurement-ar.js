// ============================================================
// REAL TREE GUY — PURE AR MODE
// Auto Line Detection • Pythagorean Math • Rigging Suggestion
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

  // Start camera
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

  // Simple vertical line detection using brightness sampling
  function detectVerticalLines(frame) {
    const { width, height } = canvas;
    const data = frame.data;

    let columns = [];

    for (let x = 0; x < width; x += 10) {
      let score = 0;

      for (let y = 0; y < height; y += 10) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = (r + g + b) / 3;

        // Dark vertical = trunk/limb
        if (brightness < 90) score++;
      }

      columns.push({ x, score });
    }

    // strongest vertical line = trunk
    columns.sort((a,b) => b.score - a.score);
    return columns.slice(0, 3); // top 3 candidates
  }

  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Draw video frame to canvas for pixel access
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Detect vertical lines
    const lines = detectVerticalLines(frame);

    if (lines.length > 0) {
      const trunk = lines[0];
      const limb = lines[1] || null;

      // Draw trunk line
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(trunk.x, 0);
      ctx.lineTo(trunk.x, canvas.height);
      ctx.stroke();

      // Tie‑in point = highest strong part of trunk
      const tieIn = { x: trunk.x, y: canvas.height * 0.25 };

      // Rigging point = lower separate limb if available
      let rig = null;
      if (limb && Math.abs(limb.x - trunk.x) > 40) {
        rig = { x: limb.x, y: canvas.height * 0.55 };
      }

      // Draw tie‑in
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(tieIn.x, tieIn.y, 10, 0, Math.PI*2);
      ctx.fill();

      // Draw rigging
      if (rig) {
        ctx.fillStyle = "#00aaff";
        ctx.beginPath();
        ctx.arc(rig.x, rig.y, 10, 0, Math.PI*2);
        ctx.fill();
      }

      // Pythagorean math between tie‑in and rigging (or trunk base)
      const base = { x: trunk.x, y: canvas.height };

      const a = Math.abs(tieIn.x - base.x);
      const b = Math.abs(tieIn.y - base.y);
      const c = Math.sqrt(a*a + b*b);

      hudA.textContent = a.toFixed(0) + " px";
      hudB.textContent = b.toFixed(0) + " px";
      hudC.textContent = c.toFixed(0) + " px";
      hudCheck.textContent = (a*a + b*b).toFixed(0);

      hudTie.textContent = "Top quarter of trunk";
      hudRig.textContent = rig ? "Lower separate limb" : "No limb detected";
    }

    requestAnimationFrame(loop);
  }

});
