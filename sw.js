const CACHE_NAME = "bb-openbox-v10";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/src/styles/openBoxFinder.css?v=10",
  "/src/scripts/main.js?v=10",
  "/src/scripts/openBoxFinderApp.js",
  "/src/scripts/config/productDepartments.js",
  "/src/scripts/config/storeLocations.js",
  "/src/scripts/data/sampleOpenBoxItems.js",
  "/src/scripts/services/aiAdvisorService.js",
  "/src/scripts/services/bestBuyInventoryApi.js",
  "/src/scripts/services/storageService.js",
  "/src/scripts/state/appState.js",
  "/src/scripts/ui/aiAdvisor.js",
  "/src/scripts/ui/departmentNav.js",
  "/src/scripts/ui/filterBar.js",
  "/src/scripts/ui/installPrompt.js",
  "/src/scripts/ui/inventoryStatus.js",
  "/src/scripts/ui/modals.js",
  "/src/scripts/ui/productDetailView.js",
  "/src/scripts/ui/productGrid.js",
  "/src/scripts/ui/salesWorkbench.js",
  "/src/scripts/ui/storePanel.js",
  "/src/scripts/ui/toast.js",
  "/src/scripts/utils/htmlUtils.js",
  "/src/scripts/utils/membershipUtils.js",
  "/src/scripts/utils/productDetailRoute.js",
  "/src/scripts/utils/productUtils.js",
  "/src/scripts/utils/quoteUtils.js",
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
