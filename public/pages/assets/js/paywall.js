// ===========================================
// REAL TREE GUY OS — PERMANENT UNLOCK SYSTEM
// ===========================================

// Secret unlock code you give users after they pay
const UNLOCK_CODE = "RTG-FOREVER-30";

// If already unlocked, skip paywall
if (localStorage.getItem("rtgPaid") === "true") {
  window.location.href = "../dashboard/index.html";
}

// Elements
const statusMsg = document.getElementById("statusMsg");
const errorMsg = document.getElementById("errorMsg");

// Add unlock UI
statusMsg.innerHTML = `
  <div style="margin-top:25px;">
    <p style="font-size:1.1rem;opacity:0.9;">Already paid? Enter your unlock code:</p>
    <input id="unlockInput" 
           placeholder="Enter unlock code" 
           style="padding:10px;width:80%;border-radius:10px;border:none;margin-top:10px;">
    <button id="unlockBtn" 
            style="margin-top:12px;padding:10px 20px;border-radius:10px;background:#3f8b44;color:white;font-weight:bold;border:2px solid #6aff6a;cursor:pointer;">
      Unlock OS
    </button>
  </div>
`;

// Unlock logic
document.getElementById("unlockBtn").onclick = () => {
  const code = document.getElementById("unlockInput").value.trim();

  if (code === UNLOCK_CODE) {
    // Store permanent unlock
    localStorage.setItem("rtgPaid", "true");

    // Redirect to dashboard
    window.location.href = "../dashboard/index.html";
  } else {
    errorMsg.textContent = "Invalid unlock code. Contact Real Tree Guy if you paid.";
  }
};
