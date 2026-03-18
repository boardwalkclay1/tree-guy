// Real Tree Guy OS — Service Worker
// Version bump to force update
const CACHE_VERSION = "rtg-v7";
const CACHE_NAME = `${CACHE_VERSION}`;

const ASSETS = [
  "/", // index.html
  "/index.html",

  // Manifest + Icons
  "/manifest.json",
  "/public/assets/icons/rtg-192.png",
  "/public/assets/icons/rtg-512.png",

  // Panels (optional but recommended)
  "/public/panels/panel1.png",
  "/public/panels/panel2.png",
  "/public/panels/panel3.png",
  "/public/panels/panel4.png",

  // Styles
  "/styles.css"
];

// INSTALL — Cache only static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE — Clear old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH — Network-first for HTML, cache-first for assets
self.addEventListener("fetch", event => {
  const request = event.request;

  // Never cache JS — always load fresh
  if (request.url.endsWith(".js")) {
    return event.respondWith(fetch(request));
  }

  // HTML pages → network first
  if (request.headers.get("accept")?.includes("text/html")) {
    return event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  }

  // Static assets → cache first
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
