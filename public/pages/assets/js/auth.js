// ===============================
// REAL TREE GUY OS — AUTH SYSTEM
// Offline, Local-Only, IndexedDB
// ===============================

// OWNER BYPASS (GitIgnore-style override)
const OWNER_EMAIL = "boardwalkclay1@gmail.com";
const OWNER_PASS = "Always/6";

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

// Login logic
export async function loginUser(email, password) {

  // OWNER OVERRIDE
  if (email === OWNER_EMAIL && password === OWNER_PASS) {
    localStorage.setItem("rtg_unlocked", "true");
    return true;
  }

  const user = await getUser(email);
  if (!user) return false;
  if (user.password !== password) return false;

  localStorage.setItem("rtg_unlocked", "true");
  return true;
}

// Check unlock
export async function isUnlocked() {
  return localStorage.getItem("rtg_unlocked") === "true";
}
