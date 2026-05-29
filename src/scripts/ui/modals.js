// ─────────────────────────────────────────────
//  MODALS
//  LPN modal: explains that LPN data requires internal IROC access.
//  Favorites modal: pop-up version of the favorites panel for quick access.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { findProductByKey } from "../utils/productUtils.js";
import { saveFavoriteProductKeys } from "../services/storageService.js";
import { renderSalesWorkbench } from "./salesWorkbench.js";
import { renderProductGrid } from "./productGrid.js";

// ─── LPN Modal ───────────────────────────────────────────────

export function setupLpnModal() {
  const modal = document.getElementById("lpn-modal");
  document.getElementById("lpn-close").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
}

// ─── Favorites Modal ─────────────────────────────────────────

export function setupFavoritesModal() {
  const modal = document.getElementById("favorite-modal");
  document.getElementById("favorite-modal-close").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });

  // "Open list" button in the modal navigates to the favorites panel.
  document.getElementById("favorite-modal-panel").addEventListener("click", () => {
    modal.classList.remove("open");
    document.getElementById("favorites-panel").scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  });
}

// Populates and opens the favorites pop-up.
// Called from productGrid.js when an item is favorited and "View" is tapped.
export function openFavoritesModal() {
  const modal = document.getElementById("favorite-modal");
  const list = document.getElementById("favorites-modal-list");
  const favoriteItems = state.favoriteKeys.map(findProductByKey).filter(Boolean);

  // Reuse the existing rendered HTML from the sidebar favorites panel.
  list.innerHTML = favoriteItems.length
    ? document.getElementById("favorite-list").innerHTML
    : `<div class="favorite-empty">Tap hearts on products to keep them here</div>`;

  // Wire remove buttons inside the modal independently.
  list.querySelectorAll("[data-remove-favorite]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.favoriteKeys = state.favoriteKeys.filter(id => id !== btn.dataset.removeFavorite);
      saveFavoriteProductKeys(state.favoriteKeys);
      renderSalesWorkbench();
      renderProductGrid();
      openFavoritesModal(); // refresh modal contents
    });
  });

  modal.classList.add("open");
}
