// ===============================
// REAL TREE GUY OS — AUTH SYSTEM
// Offline, Local-Only, IndexedDB
// ===============================

// OWNER BYPASS (GitIgnore-style override)
const OWNER_EMAIL = "boardwalkclay1@gmail.com";
const OWNER_PASS = "Always/6";

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

// Helper: find special client
function getSpecialClient(email) {
  return specialClientsData.specialClients.find(
    client => client.email === email
  );
}

// ============================================================
// INDEXEDDB SETUP
// ============================================================

// Open or create DB
export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("rtg_os", 1);

    req.onupgradeneeded = () => {
      req.result.createObjectStore("auth", { keyPath: "email" });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save user (Signup)
export async function saveUser(email, password) {
  const db = await openDB();
  const tx = db.transaction("auth", "readwrite");
  tx.objectStore("auth").put({
    email,
    password,
    unlocked: true,
    created: Date.now()
  });
  return tx.complete;
}

// Get user (Login)
export async function getUser(email) {
  const db = await openDB();
  const tx = db.transaction("auth", "readonly");
  return tx.objectStore("auth").get(email);
}

// ============================================================
// LOGIN LOGIC (with special-client support)
// ============================================================

export async function loginUser(email, password) {

  // 1. OWNER OVERRIDE
  if (email === OWNER_EMAIL && password === OWNER_PASS) {
    localStorage.setItem("rtg_unlocked", "true");
    return true;
  }

  // 2. SPECIAL CLIENT CHECK
  const special = getSpecialClient(email);

  if (special && special.canCreatePassword) {
    // Redirect to password creation page
    window.location.href = "/pages/create-password.html";
    return false; // stop normal login
  }

  // 3. NORMAL USER LOGIN
  const user = await getUser(email);
  if (!user) return false;
  if (user.password !== password) return false;

  localStorage.setItem("rtg_unlocked", "true");
  return true;
}

// ============================================================
// CHECK UNLOCK
// ============================================================

export async function isUnlocked() {
  return localStorage.getItem("rtg_unlocked") === "true";
}
