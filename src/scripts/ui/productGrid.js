import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";
import { getVisibleProducts, getProductKey } from "../utils/productUtils.js";
import { makeProductDetailUrl } from "../utils/productDetailRoute.js";
import { escapeHtml, getActiveFilterChips } from "../utils/htmlUtils.js";
import { saveFavoriteProductKeys } from "../services/storageService.js";
import { showToast } from "./toast.js";
import { renderSalesWorkbench } from "./salesWorkbench.js";
import { openFavoritesModal } from "./modals.js";

export function renderProductGrid() {
  const items = getVisibleProducts();
  const grid = document.getElementById("product-grid");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("results-count");

  const dept = DEPTS.find(d => d.id === state.selectedDeptId);
  const chips = getActiveFilterChips();
  const chipHtml = chips.length
    ? chips.map(c => `<span class="results-filter">${escapeHtml(c.label)} <b>${escapeHtml(c.value)}</b></span>`).join("")
    : `<span class="results-filter">Showing <b>all ${escapeHtml(dept?.label || "deals")}</b></span>`;

  count.innerHTML = `
    <div><strong>${items.length}</strong> open box deal${items.length !== 1 ? "s" : ""} in ${dept?.label || ""}</div>
    <div class="results-filters">${chipHtml}</div>
  `;

  if (!items.length) {
    grid.innerHTML = "";
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  grid.innerHTML = items.map(item => buildCardHtml(item)).join("");

  grid.querySelectorAll(".pcard").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest("[data-action]")) return;
      const id = card.dataset.id;
      history.pushState({ productDetail: true }, "", makeProductDetailUrl(window.location.href, id));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
  });

  grid.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      handleCardAction(btn);
    });
  });

  renderSalesWorkbench();
}

function buildCardHtml(item) {
  const id = getProductKey(item);
  const isHot = item.pct >= 35 || item.savings >= 600;
  const dept = DEPTS.find(d => d.id === item.category);

  const inCompare = state.comparisonKeys.includes(id);
  const inQuote = state.quoteKeys.includes(id);
  const isFavorite = state.favoriteKeys.includes(id);

  const { condClass, condLabel } = getConditionDisplay(item.cond);
  const specsHtml = item.specs.map(s => `<span class="spec-chip">${s}</span>`).join("");

  return `<div class="pcard" data-id="${id}">
    <div class="pc-img-wrap">
      ${item.img
        ? `<img class="pc-img" src="${item.img}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>
           <div class="pc-img-placeholder" style="display:none">${dept?.icon || "📦"}</div>`
        : `<div class="pc-img-placeholder">${dept?.icon || "📦"}</div>`}
      <div class="pc-cond-badge ${condClass}">${condLabel}</div>
      <button class="favorite-toggle${isFavorite ? " on" : ""}" data-id="${id}" data-action="favorite"
        type="button" aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}">♥</button>
      ${isHot ? `<div class="pc-hot">Hot</div>` : ""}
    </div>
    <div class="pc-body">
      ${item.brand ? `<div class="pc-brand">${item.brand}</div>` : ""}
      <div class="pc-name">${item.name}</div>
      ${specsHtml ? `<div class="pc-specs">${specsHtml}</div>` : ""}
      <div class="pc-pricing">
        <div class="pc-price-left">
          <div class="pc-sale">$${item.sale.toFixed(2)}</div>
          <div class="pc-was">Was <span>$${item.reg.toFixed(2)}</span></div>
        </div>
        <div class="pc-save-pill">-${item.pct}% · Save $${item.savings.toFixed(0)}</div>
      </div>
    </div>
    <div class="pc-footer">
      <button class="pc-act primary" data-sku="${item.sku}" data-action="copy">Copy SKU</button>
      <button class="pc-act" data-id="${id}" data-action="compare">${inCompare ? "Compared" : "Compare"}</button>
      <button class="pc-act" data-id="${id}" data-action="quote">${inQuote ? "In Basket" : "Basket"}</button>
      <button class="pc-act" data-url="${item.url}" data-action="link">BB.com</button>
    </div>
  </div>`;
}

function getConditionDisplay(cond) {
  const map = {
    excellent: { condClass: "cond-exc", condLabel: "Excellent" },
    certified: { condClass: "cond-cert", condLabel: "Certified" },
    good: { condClass: "cond-good", condLabel: "Good" },
  };
  return map[cond] || { condClass: "cond-sat", condLabel: "Satisfactory" };
}

function handleCardAction(btn) {
  const { action } = btn.dataset;

  if (action === "copy") {
    navigator.clipboard.writeText(btn.dataset.sku).catch(() => {});
    showToast(`SKU ${btn.dataset.sku} copied!`);
    return;
  }

  if (action === "compare") {
    const { id } = btn.dataset;
    if (state.comparisonKeys.includes(id)) {
      state.comparisonKeys = state.comparisonKeys.filter(x => x !== id);
    } else if (state.comparisonKeys.length < 3) {
      state.comparisonKeys.push(id);
    } else {
      showToast("Compare holds 3 items max");
      return;
    }
    renderSalesWorkbench();
    renderProductGrid();
    return;
  }

  if (action === "quote") {
    const { id } = btn.dataset;
    if (state.quoteKeys.includes(id)) {
      state.quoteKeys = state.quoteKeys.filter(x => x !== id);
    } else {
      state.quoteKeys.push(id);
    }
    renderSalesWorkbench();
    renderProductGrid();
    return;
  }

  if (action === "favorite") {
    const { id } = btn.dataset;
    if (state.favoriteKeys.includes(id)) {
      state.favoriteKeys = state.favoriteKeys.filter(x => x !== id);
      showToast("Removed from favorites");
    } else {
      state.favoriteKeys.push(id);
      showToast("Saved to favorites", { label: "View", onClick: openFavoritesModal });
    }
    saveFavoriteProductKeys(state.favoriteKeys);
    renderSalesWorkbench();
    renderProductGrid();
    return;
  }

  if (action === "link") {
    window.open(btn.dataset.url, "_blank");
    return;
  }

  if (action === "lpn") {
    document.getElementById("lpn-modal").classList.add("open");
  }
}
