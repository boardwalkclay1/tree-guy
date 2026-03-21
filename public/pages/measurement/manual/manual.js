document.getElementById("calcHeight").onclick = () => {
  const d = parseFloat(document.getElementById("dist").value);
  const a = parseFloat(document.getElementById("angle").value);
  const e = parseFloat(document.getElementById("eye").value);

  if (!d || !a) {
    heightResult.innerHTML = "Enter distance and angle.";
    return;
  }

  const rad = a * Math.PI / 180;
  const h = d * Math.tan(rad) + e;

  heightResult.innerHTML = `Estimated Height: <strong>${h.toFixed(1)} ft</strong>`;
};

document.getElementById("calcDBH").onclick = () => {
  const c = parseFloat(document.getElementById("circ").value);
  if (!c) {
    dbhResult.innerHTML = "Enter circumference.";
    return;
  }
  const dbh = c / Math.PI;
  dbhResult.innerHTML = `DBH: <strong>${dbh.toFixed(2)} inches</strong>`;
};
