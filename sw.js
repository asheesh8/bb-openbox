const CACHE_NAME = "bb-openbox-v4";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/src/styles/openBoxFinder.css",
  "/src/scripts/openBoxFinderApp.js",
  "/src/scripts/config/productDepartments.js",
  "/src/scripts/config/storeLocations.js",
  "/src/scripts/data/sampleOpenBoxItems.js",
  "/src/scripts/services/bestBuyInventoryApi.js",
  "/assets/app-icon.svg",
  "/assets/app-icon-512.png",
  "/assets/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match("/index.html")))
  );
});
