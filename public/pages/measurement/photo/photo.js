const input = document.getElementById("photoInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let img = new Image();
let points = [];

input.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
};

canvas.onclick = e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  points.push({ x, y });

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
};

document.getElementById("calcPhoto").onclick = () => {
  if (points.length < 2) {
    photoResult.innerHTML = "Mark base and top.";
    return;
  }

  const ref = parseFloat(document.getElementById("refHeight").value);
  if (!ref) {
    photoResult.innerHTML = "Enter reference height.";
    return;
  }

  const pixelHeight = Math.abs(points[1].y - points[0].y);
  const ftPerPixel = ref / pixelHeight;
  const treeHeight = pixelHeight * ftPerPixel;

  photoResult.innerHTML = `Estimated Height: <strong>${treeHeight.toFixed(1)} ft</strong>`;
};
