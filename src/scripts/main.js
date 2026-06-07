// ─────────────────────────────────────────────
//  MAIN ENTRY POINT
//  Bootstraps the app and wires all top-level event listeners.
//
//  Module map:
//    state/appState       ← mutable singleton (imported everywhere)
//    config/              ← static department and store definitions
//    data/                ← demo inventory
//    services/            ← API calls and storage (no DOM access)
//    utils/               ← pure business-logic helpers (no DOM access)
//    ui/                  ← render functions and event setup (DOM access)
//    main.js (this file)  ← wires cross-cutting events and starts the app
// ─────────────────────────────────────────────

import state from "./state/appState.js";
import { DEMO_ITEMS } from "./data/sampleOpenBoxItems.js";
import { fetchOpenBoxInventory, verifyBestBuyApiKey } from "./services/bestBuyInventoryApi.js";
import { saveApiKey, clearApiKey, saveStoreId } from "./services/storageService.js";
import { renderStoreDropdown, renderStoreSummary, getSelectedStore } from "./ui/storePanel.js";
import { renderInventoryStatus } from "./ui/inventoryStatus.js";
import { renderDepartmentTabs } from "./ui/departmentNav.js";
import { renderFilterBar } from "./ui/filterBar.js";
import { renderProductGrid } from "./ui/productGrid.js";
import { renderSalesWorkbench } from "./ui/salesWorkbench.js";
import { setupProductDetailView, renderProductDetailFromUrl } from "./ui/productDetailView.js";
import { setupLpnModal, setupFavoritesModal } from "./ui/modals.js";
import { setupAiAdvisor } from "./ui/aiAdvisor.js";
import { setupInstallPrompt, registerServiceWorker } from "./ui/installPrompt.js";
import { showToast } from "./ui/toast.js";
import { resetFiltersForDept } from "./utils/productUtils.js";
import { buildQuoteText, buildFavoritesText } from "./utils/quoteUtils.js";

// ─────────────────────────────────────────────
//  STARTUP
// ─────────────────────────────────────────────

registerServiceWorker();
setupInstallPrompt();
setupLpnModal();
setupFavoritesModal();
setupAiAdvisor();
setupProductDetailView();
wireStaticEventListeners();

// Decide what to show on load:
//   ?demo=1 in the URL → jump straight into sample data (useful for sharing a demo link)
//   stored API key     → go straight to live inventory
//   otherwise          → show the gate so the associate can enter a key or tap Sample Data
const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get("demo") === "1") {
  searchParams.delete("demo");
  const cleanUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", cleanUrl);
  document.getElementById("gate").style.display = "none";
  startApp(true);
} else if (state.apiKey) {
  document.getElementById("gate").style.display = "none";
  startApp(false);
} else {
  // No key stored — show the gate. Associate can enter a key or tap Sample Data.
  document.getElementById("gate").style.display = "flex";
}

// ─────────────────────────────────────────────
//  APP INITIALIZATION
// ─────────────────────────────────────────────

async function startApp(demo) {
  state.isDemoMode = demo;
  const loading = document.getElementById("loading");
  loading.style.display = "flex";

  try {
    if (!demo) {
      document.getElementById("load-label").textContent = "Fetching live open box inventory…";
      document.getElementById("load-cat").textContent = "Connecting to Best Buy API";
      state.allProducts = await loadLiveInventory();
    } else {
      state.allProducts = DEMO_ITEMS;
    }

    loading.style.display = "none";
    document.getElementById("app").classList.add("on");
    state.lastFetchedAt = new Date();

    renderStoreDropdown();
    renderStoreSummary();
    renderDepartmentTabs();
    resetFiltersForDept();
    renderFilterBar();
    renderProductGrid();
    renderSalesWorkbench();
    renderInventoryStatus();
    renderProductDetailFromUrl();
  } catch (err) {
    console.error("App startup failed", err);
    loading.style.display = "none";
    document.getElementById("gate").style.display = "flex";
    showGateError("Sample data could not load. Refresh once and try again.");
  }
}

// Pulls live inventory for the currently selected store via the Best Buy API.
async function loadLiveInventory() {
  return fetchOpenBoxInventory({
    apiKey: state.apiKey,
    store: getSelectedStore(),
    onStatus: status => {
      document.getElementById("load-cat").textContent = status;
    },
  });
}

// ─────────────────────────────────────────────
//  GATE SCREEN (API key entry + demo entry)
// ─────────────────────────────────────────────

document.getElementById("gate-btn").addEventListener("click", async () => {
  const key = document.getElementById("api-key").value.trim();
  if (!key) return showGateError("Please paste your API key.");

  const btn = document.getElementById("gate-btn");
  btn.disabled = true;
  btn.textContent = "Verifying…";

  const valid = await verifyBestBuyApiKey(key);
  if (valid) {
    state.apiKey = key;
    saveApiKey(key);
    document.getElementById("gate").style.display = "none";
    startApp(false);
  } else {
    btn.disabled = false;
    btn.textContent = "Connect →";
    showGateError("Invalid key or network error. Try again.");
  }
});

document.getElementById("demo-btn").addEventListener("click", e => {
  e.preventDefault();
  const btn = document.getElementById("demo-btn");
  btn.setAttribute("aria-disabled", "true");
  btn.textContent = "Opening sample data...";
  document.getElementById("gate").style.display = "none";
  startApp(true);
});

document.getElementById("gate-more-toggle").addEventListener("click", () => {
  const panel = document.getElementById("gate-more");
  const isOpen = panel.classList.toggle("open");
  document.getElementById("gate-more-toggle").setAttribute("aria-expanded", String(isOpen));
});

// Demo SSO simulates a Microsoft/PingID login flow for training purposes.
document.getElementById("sso-demo-btn").addEventListener("click", async () => {
  const btn = document.getElementById("sso-demo-btn");
  const status = document.getElementById("sso-status");
  btn.disabled = true;
  btn.textContent = "Redirecting to Microsoft…";
  await new Promise(r => setTimeout(r, 550));
  btn.textContent = "Waiting for PingID approval…";
  await new Promise(r => setTimeout(r, 700));
  status.classList.add("show");
  btn.textContent = "SSO demo verified";
  setTimeout(() => {
    state.signedInRole = "Sales";
    document.getElementById("gate").style.display = "none";
    startApp(true);
    showToast("Demo SSO session started");
  }, 650);
});

// ─────────────────────────────────────────────
//  STATIC EVENT LISTENERS
//  These are wired once at startup and don't depend on rendered DOM.
// ─────────────────────────────────────────────

function wireStaticEventListeners() {
  // Store switcher — re-scopes live inventory to the selected location.
  document.getElementById("store-select").addEventListener("change", async e => {
    state.selectedStoreId = e.target.value;
    saveStoreId(state.selectedStoreId);
    renderStoreSummary();
    renderSalesWorkbench();

    if (!state.isDemoMode && state.allProducts.length) {
      const btn = document.getElementById("refresh-btn");
      btn.classList.add("spin");
      state.allProducts = await loadLiveInventory();
      btn.classList.remove("spin");
      state.lastFetchedAt = new Date();
      renderInventoryStatus();
      renderProductGrid();
      showToast(`Inventory scoped to ${getSelectedStore().city}`);
    }
  });

  // Settings / cog — clears the stored API key and returns to the gate screen.
  // No reload needed; the app stays in memory so re-entering a key is instant.
  document.getElementById("settings-btn").addEventListener("click", () => {
    clearApiKey();
    state.apiKey = "";
    document.getElementById("app").classList.remove("on");
    document.getElementById("gate").style.display = "flex";
    document.getElementById("gate-err").style.display = "none";
    document.getElementById("api-key").value = "";
  });

  // Manual inventory refresh button.
  document.getElementById("refresh-btn").addEventListener("click", async () => {
    if (state.isDemoMode) {
      showToast("Sample data — add API key to refresh live");
      return;
    }
    const btn = document.getElementById("refresh-btn");
    btn.classList.add("spin");
    state.allProducts = await loadLiveInventory();
    state.lastFetchedAt = new Date();
    btn.classList.remove("spin");
    renderInventoryStatus();
    renderProductGrid();
    showToast("Inventory refreshed!");
  });

  // Search box.
  document.getElementById("search-inp").addEventListener("input", e => {
    state.searchText = e.target.value;
    renderProductGrid();
  });

  // Quote FAB scrolls the quote panel into view.
  document.getElementById("quote-fab").addEventListener("click", () => {
    document.getElementById("quote-panel").scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  });

  // Quote clipboard copy.
  document.getElementById("copy-quote-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(buildQuoteText()).catch(() => {});
    showToast("Quote copied for customer recap");
  });

  // Favorites clipboard copy.
  document.getElementById("copy-favorites-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(buildFavoritesText()).catch(() => {});
    showToast(state.favoriteKeys.length ? "Favorites list copied" : "No favorites to copy");
  });

  // Clear favorites.
  document.getElementById("clear-favorites-btn").addEventListener("click", () => {
    state.favoriteKeys = [];
    import("./services/storageService.js").then(({ saveFavoriteProductKeys }) =>
      saveFavoriteProductKeys([])
    );
    renderSalesWorkbench();
    renderProductGrid();
    showToast("Favorites cleared");
  });

  // Clear all sales workbench selections.
  document.getElementById("clear-sales-btn").addEventListener("click", () => {
    state.comparisonKeys = [];
    state.quoteKeys = [];
    state.selectedMember = null;
    document.getElementById("member-input").value = "";
    renderSalesWorkbench();
    renderProductGrid();
  });

  // Member lookup (demo — returns a hardcoded member profile).
  document.getElementById("member-lookup-btn").addEventListener("click", () => {
    const raw = document.getElementById("member-input").value.trim();
    // Toggle card-on-file so associates can demo both card and no-card flows.
    state.demoCardOnFile = !state.demoCardOnFile;
    state.selectedMember = {
      name: "Jordan M.",
      handle: raw || "802-555-0136",
      tier: "My Best Buy Plus",
      hasCard: state.demoCardOnFile,
      card: state.demoCardOnFile ? "Best Buy Card on file" : "No Best Buy Card",
      cardType: state.demoCardOnFile ? "Visa ending 4421" : "",
      rewards: "$15 rewards",
      financing: state.demoCardOnFile ? "12-mo financing eligible" : "Card offer available",
    };
    renderSalesWorkbench();
    showToast("Demo member basket opened");
  });

  // Membership plan toggle (Plus / Total).
  document.querySelectorAll(".attach-card").forEach(btn => {
    btn.addEventListener("click", () => {
      state.membershipPlan = btn.dataset.plan;
      renderSalesWorkbench();
    });
  });
}

// ─────────────────────────────────────────────
//  GATE HELPERS
// ─────────────────────────────────────────────

function showGateError(msg) {
  const el = document.getElementById("gate-err");
  el.textContent = msg;
  el.style.display = "block";
}
