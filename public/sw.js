// Real Tree Guy OS — Service Worker (FINAL BUILD)
// Version bump to force update
const CACHE_VERSION = "rtg-v8";
const CACHE_NAME = CACHE_VERSION;

const ASSETS = [
  "/",               // index.html
  "/index.html",
  "/manifest.json",

  // Icons (correct Cloudflare paths)
  "/assets/icons/rtg-192.png",
  "/assets/icons/rtg-512.png",
  "/assets/icons/rtg-logo-72.png",
  "/assets/icons/rtg-logo-96.png",
  "/assets/icons/rtg-logo-128.png",
  "/assets/icons/rtg-logo-144.png",
  "/assets/icons/rtg-logo-152.png",
  "/assets/icons/rtg-logo-384.png",
  "/assets/icons/rtg-logo-512.png",

  // Social preview / QR
  "/assets/img/RTG-qrcode.png",

  // Panels
  "/panels/panel1.png",
  "/panels/panel2.png",
  "/panels/panel3.png",
  "/panels/panel4.png",

  // Global styles
  "/styles.css"
];

// INSTALL — Cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE — Remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH — Network-first for HTML, cache-first for assets
self.addEventListener("fetch", event => {
  const req = event.request;

  // Never cache JS — always fresh
  if (req.url.endsWith(".js")) {
    return event.respondWith(fetch(req));
  }

  // HTML → network first
  if (req.headers.get("accept")?.includes("text/html")) {
    return event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }

  // Static assets → cache first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
