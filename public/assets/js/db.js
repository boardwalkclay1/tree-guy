// db.js — Real Tree Guy OS IndexedDB Engine (Standalone)

const DB_NAME = "RealTreeGuyOS";
const DB_VERSION = 1;

let db = null;

/* ============================================================
   INIT DB
   ============================================================ */
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;

      // Create stores ONLY if they don't exist
      if (!db.objectStoreNames.contains("profile")) {
        db.createObjectStore("profile", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("jobs")) {
        db.createObjectStore("jobs", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("calendar")) {
        db.createObjectStore("calendar", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("contracts")) {
        db.createObjectStore("contracts", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => reject(e);
  });
}

/* ============================================================
   SAVE (PUT)
   ============================================================ */
export function save(store, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(data);

    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e);
  });
}

/* ============================================================
   GET ONE
   ============================================================ */
export function get(store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

/* ============================================================
   GET ALL
   ============================================================ */
export function getAll(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

/* ============================================================
   DELETE ONE
   ============================================================ */
export function remove(store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);

    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e);
  });
}
