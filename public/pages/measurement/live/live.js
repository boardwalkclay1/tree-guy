const video = document.getElementById("camera");
let baseAngle = null;

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);

window.addEventListener("deviceorientation", e => {
  window.currentAngle = e.beta; // tilt angle
});

document.getElementById("setBase").onclick = () => {
  baseAngle = window.currentAngle;
  liveResult.innerHTML = "Base marked.";
};

document.getElementById("calcLive").onclick = () => {
  const dist = parseFloat(document.getElementById("liveDist").value);
  if (!dist || baseAngle === null) {
    liveResult.innerHTML = "Enter distance and mark base.";
    return;
  }

  const topAngle = window.currentAngle;
  const tilt = topAngle - baseAngle;
  const rad = tilt * Math.PI / 180;

  const height = dist * Math.tan(rad) + 5.5;

  liveResult.innerHTML = `Estimated Height: <strong>${height.toFixed(1)} ft</strong>`;
};
