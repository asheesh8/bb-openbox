// ─────────────────────────────────────────────
//  PRODUCT GRID
//  Renders the card grid and handles all card-level actions:
//  copy SKU, compare, basket, favorite, BB.com link, LPN lookup.
//
//  Note: renderProductGrid and renderSalesWorkbench call each other —
//  this circular ES module dep is intentional and safe because neither
//  is called at module load time, only inside event handlers.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";
import { getVisibleProducts, getProductKey } from "../utils/productUtils.js";
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

  // Expand / collapse a card when the associate taps the card body.
  grid.querySelectorAll(".pcard").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest("[data-action]")) return;
      const id = card.dataset.id;
      state.expandedProductKey = state.expandedProductKey === id ? null : id;
      renderProductGrid();
    });
  });

  // All button actions on a card are handled centrally here.
  grid.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      handleCardAction(btn);
    });
  });

  // Sync the workbench panels (compare, quote, favorites) after grid rebuild.
  renderSalesWorkbench();
}

// ─── Card HTML Builder ──────────────────────────────────────

function buildCardHtml(item) {
  const id = getProductKey(item);
  const isExpanded = state.expandedProductKey === id;
  const isHot = item.pct >= 35 || item.savings >= 600;
  const dept = DEPTS.find(d => d.id === item.category);

  const inCompare = state.comparisonKeys.includes(id);
  const inQuote = state.quoteKeys.includes(id);
  const isFavorite = state.favoriteKeys.includes(id);

  const { condClass, condLabel } = getConditionDisplay(item.cond);
  const specsHtml = item.specs.map(s => `<span class="spec-chip">${s}</span>`).join("");
  const sellNote = buildSellNote(item, condLabel);

  return `<div class="pcard${isExpanded ? " expanded" : ""}" data-id="${id}">
    <div class="pc-img-wrap">
      ${item.img
        ? `<img class="pc-img" src="${item.img}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>
           <div class="pc-img-placeholder" style="display:none">${dept?.icon || "📦"}</div>`
        : `<div class="pc-img-placeholder">${dept?.icon || "📦"}</div>`}
      <div class="pc-cond-badge ${condClass}">${condLabel}</div>
      <button class="favorite-toggle${isFavorite ? " on" : ""}" data-id="${id}" data-action="favorite"
        type="button" aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}">♥</button>
      ${isHot ? `<div class="pc-hot">🔥 Hot</div>` : ""}
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
        <div class="pc-save-pill">−${item.pct}% · Save $${item.savings.toFixed(0)}</div>
      </div>
    </div>
    <div class="pc-footer">
      <button class="pc-act primary" data-sku="${item.sku}" data-action="copy">📋 Copy SKU</button>
      <button class="pc-act" data-id="${id}" data-action="compare">${inCompare ? "✓ Compared" : "⇄ Compare"}</button>
      <button class="pc-act" data-id="${id}" data-action="quote">${inQuote ? "✓ In Basket" : "＋ Basket"}</button>
      <button class="pc-act" data-url="${item.url}" data-action="link">🔗 BB.com</button>
    </div>
    <div class="pc-expand${isExpanded ? " open" : ""}">
      <div class="pc-expand-in">
        <div class="expand-section">
          <div class="expand-label">Price Breakdown</div>
          <div class="price-breakdown">
            <div class="pb-row"><span class="pb-label">New price</span><span class="pb-val strike">$${item.reg.toFixed(2)}</span></div>
            <div class="pb-row"><span class="pb-label">Open box price</span><span class="pb-val blue">$${item.sale.toFixed(2)}</span></div>
            <div class="pb-row"><span class="pb-label">You save</span><span class="pb-val green">$${item.savings.toFixed(2)} (${item.pct}% off)</span></div>
            <div class="pb-row"><span class="pb-label">Condition</span><span class="pb-val">${condLabel}</span></div>
            ${item.rating
              ? `<div class="pb-row"><span class="pb-label">Customer rating</span><span class="pb-val">${item.rating} ★ (${item.reviews.toLocaleString()} reviews)</span></div>`
              : ""}
          </div>
        </div>
        <div class="expand-section">
          <div class="expand-label">Sell Notes</div>
          <div class="sell-note">${sellNote}</div>
        </div>
        <div class="expand-section">
          <div class="expand-label">SKU</div>
          <div class="sku-strip">
            <span class="sku-mono">${item.sku}</span>
            <button class="sku-cp" data-sku="${item.sku}" data-action="copy">Copy</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function getConditionDisplay(cond) {
  const map = {
    excellent: { condClass: "cond-exc", condLabel: "Excellent" },
    certified: { condClass: "cond-cert", condLabel: "Certified" },
    good:      { condClass: "cond-good", condLabel: "Good" },
  };
  return map[cond] || { condClass: "cond-sat", condLabel: "Satisfactory" };
}

// Coaching blurb tailored to each condition tier — helps associates lead the close.
function buildSellNote(item, condLabel) {
  const savings = `<strong>Save $${item.savings.toFixed(2)} (${item.pct}% off)</strong>`;
  if (item.cond === "excellent") return `Looks brand new — easiest close. Lead with ${savings}. Full return window applies.`;
  if (item.cond === "certified") return `Geek Squad certified — passed inspection. ${savings}. Arguably safer than standard open box.`;
  if (item.cond === "good") return `Good condition value play — be upfront that packaging or light cosmetic wear may show, then anchor on ${savings}.`;
  return `Budget close — set expectations on cosmetic wear first, then make the savings unmistakable with ${savings}.`;
}

// ─── Card Action Handler ─────────────────────────────────────

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
      // Show toast with "View" action that opens the favorites modal.
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
