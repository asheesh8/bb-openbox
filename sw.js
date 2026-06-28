const CACHE_NAME = "bb-openbox-v11";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/src/styles/openBoxFinder.css?v=10",
  "/src/scripts/main.js?v=11",
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

  const url = new URL(event.request.url);

  // Only handle our own origin. Cross-origin requests — most importantly the
  // Best Buy API and Anthropic calls — must go straight to the network. If the
  // worker intercepted them, a failed API call would fall back to index.html
  // (a 200 HTML page), which made the API-key check falsely "succeed" and left
  // inventory empty.
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === "navigate";

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Only navigations get the app shell as an offline fallback. Asset,
          // script, and data requests must fail honestly instead of receiving
          // HTML they can't parse.
          if (isNavigation) return caches.match("/index.html");
          return Response.error();
        })
      )
  );
});
