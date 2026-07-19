// ===============================
// REAL TREE GUY OS — AUTH SYSTEM
// Offline, Local-Only, IndexedDB + D1 Email Verification
// ===============================

// OWNER BYPASS (DEV ACCOUNT)
const OWNER_EMAIL = "boardwalkclay1@gmail.com";
const OWNER_PASS = "Always/6";
const OWNER_ID = "owner_dev";
const OWNER_TYPE = "tree";

// ============================================================
// SPECIAL CLIENTS — LOCAL JSON DATA
// ============================================================
const specialClientsData = {
  specialClients: [
    {
      id: "client_001",
      email: "davidmoussalli@gmail.com",
      canCreatePassword: true,
      status: "pending",
      createdAt: "2026-03-24T00:00:00Z"
    }
  ]
};

function getSpecialClient(email) {
  return specialClientsData.specialClients.find(
    client => client.email === email
  );
}

// ============================================================
// INDEXEDDB SETUP
// ============================================================
export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("rtg_os", 3);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("auth")) {
        db.createObjectStore("auth", { keyPath: "email" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ============================================================
// SAVE USER (LOCAL ONLY, BUT D1-AWARE FIELDS)
// ============================================================
export async function saveUser(email, password, id, type = "tree", verified = false) {
  const db = await openDB();
  const tx = db.transaction("auth", "readwrite");
  tx.objectStore("auth").put({
    email,
    password,
    id,
    type,
    verified,
    unlocked: false,
    created: Date.now()
  });
  return tx.complete;
}

export async function getUser(email) {
  const db = await openDB();
  const tx = db.transaction("auth", "readonly");
  return tx.objectStore("auth").get(email);
}

// ============================================================
// SEND VERIFICATION EMAIL (CALLS WORKER)
// ============================================================
async function sendVerificationEmail(email, name, userId) {
  const r = await fetch("/api/verify/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name,
      user_id: userId
    })
  });

  return r.json();
}

// ============================================================
// LOGIN LOGIC (WITH EMAIL VERIFICATION)
// ============================================================
export async function loginUser(email, password) {
  // 1. OWNER OVERRIDE
  if (email === OWNER_EMAIL && password === OWNER_PASS) {
    localStorage.setItem("rtg_unlocked", "true");
    localStorage.setItem("rtgToken", "dev");
    localStorage.setItem("rtgUserEmail", OWNER_EMAIL);
    localStorage.setItem("rtgUserId", OWNER_ID);
    localStorage.setItem("rtgUserType", OWNER_TYPE);
    localStorage.setItem("rtgVerified", "true");
    return true;
  }

  // 2. SPECIAL CLIENT CHECK
  const special = getSpecialClient(email);
  if (special && special.canCreatePassword) {
    window.location.href = "/pages/create-password.html";
    return false;
  }

  // 3. NORMAL USER LOGIN
  const user = await getUser(email);
  if (!user) return false;
  if (user.password !== password) return false;

  // 4. Require email verification
  if (!user.verified) {
    const verifyReq = await sendVerificationEmail(email, email.split("@")[0], user.id);

    // Redirect to "check your email" page
    window.location.href = "/pages/check-email.html";
    return false;
  }

  // 5. Verified → unlock
  localStorage.setItem("rtg_unlocked", "true");
  localStorage.setItem("rtgToken", "dev");
  localStorage.setItem("rtgUserEmail", user.email);
  localStorage.setItem("rtgUserId", user.id || "local_" + user.email);
  localStorage.setItem("rtgUserType", user.type || "tree");
  localStorage.setItem("rtgVerified", "true");

  return true;
}

// ============================================================
// CHECK UNLOCK
// ============================================================
export async function isUnlocked() {
  return localStorage.getItem("rtg_unlocked") === "true";
}
