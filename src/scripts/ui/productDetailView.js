import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";
import { getProductKey, findProductByKey } from "../utils/productUtils.js";
import { getProductDetailParam, makeProductListUrl } from "../utils/productDetailRoute.js";
import { getSelectedStore } from "./storePanel.js";
import { showToast } from "./toast.js";
import { renderSalesWorkbench } from "./salesWorkbench.js";
import { renderProductGrid } from "./productGrid.js";

let isSetup = false;

export function setupProductDetailView() {
  if (isSetup) return;
  isSetup = true;

  window.addEventListener("hashchange", renderProductDetailFromUrl);
  window.addEventListener("popstate", renderProductDetailFromUrl);

  getDetailElement().addEventListener("click", e => {
    const btn = e.target.closest("[data-detail-action]");
    if (btn) handleDetailAction(btn);
  });
}

export function renderProductDetailFromUrl() {
  const nextKey = getProductDetailParam(window.location.href);
  const shouldResetScroll = Boolean(nextKey && nextKey !== state.detailProductKey);
  state.detailProductKey = nextKey;
  renderProductDetail();
  if (shouldResetScroll) window.scrollTo(0, 0);
}

export function closeProductDetail() {
  state.detailProductKey = null;
  if (history.state?.productDetail) {
    history.back();
    return;
  }
  history.replaceState({}, "", makeProductListUrl(window.location.href));
  renderProductDetail();
}

function renderProductDetail() {
  const app = document.getElementById("app");
  const detail = getDetailElement();
  const item = state.detailProductKey ? findProductByKey(state.detailProductKey) : null;

  app.classList.toggle("detail-open", Boolean(item));
  if (!item) {
    detail.hidden = true;
    detail.innerHTML = "";
    return;
  }

  const id = getProductKey(item);
  const dept = DEPTS.find(d => d.id === item.category);
  const store = getSelectedStore();
  const inCompare = state.comparisonKeys.includes(id);
  const inQuote = state.quoteKeys.includes(id);
  const condition = getConditionDisplay(item.cond);
  const specs = item.specs.map(s => `<span class="detail-spec">${escapeHtml(s)}</span>`).join("");

  detail.hidden = false;
  detail.innerHTML = `
    <div class="detail-shell">
      <div class="detail-topbar">
        <button class="detail-back" data-detail-action="back" type="button">Back to results</button>
        <span class="detail-store">Store ${store.bbStoreId} - ${state.isDemoMode ? "Sample inventory" : "Live inventory"}</span>
      </div>

      <div class="detail-main">
        <section class="detail-media" aria-label="Product image">
          ${item.img
            ? `<img class="detail-img" src="${item.img}" alt="${escapeHtml(item.name)}"/>`
            : `<div class="detail-img-placeholder">${dept?.icon || "Item"}</div>`}
          <div class="detail-condition ${condition.condClass}">${condition.condLabel}</div>
        </section>

        <section class="detail-info" aria-label="Product details">
          <div class="detail-brand">${escapeHtml(item.brand || dept?.label || "Open Box")}</div>
          <h1 class="detail-title">${escapeHtml(item.name)}</h1>
          <p class="detail-desc">${escapeHtml(item.desc)}</p>
          <div class="detail-specs">${specs}</div>

          <div class="detail-price-card">
            <div>
              <div class="detail-sale">$${item.sale.toFixed(2)}</div>
              <div class="detail-was">Was <span>$${item.reg.toFixed(2)}</span></div>
            </div>
            <div class="detail-save">Save $${item.savings.toFixed(0)}<span>${item.pct}% off</span></div>
          </div>

          <div class="detail-action-grid">
            <button class="detail-action primary" data-detail-action="quote" data-id="${id}" type="button">${inQuote ? "Remove from Basket" : "Add to Basket"}</button>
            <button class="detail-action" data-detail-action="compare" data-id="${id}" type="button">${inCompare ? "Remove Compare" : "Compare"}</button>
            <button class="detail-action" data-detail-action="copy" data-sku="${item.sku}" type="button">Copy SKU</button>
            <button class="detail-action" data-detail-action="bb" data-url="${item.url}" type="button">Open BB.com</button>
          </div>
        </section>
      </div>

      <div class="detail-panels">
        <section class="detail-panel">
          <div class="detail-panel-title">Inventory</div>
          <div class="detail-inventory">${buildInventoryRows(item, store)}</div>
        </section>

        <section class="detail-panel">
          <div class="detail-panel-title">Open Box Details</div>
          <div class="detail-note">${buildSellNote(item)}</div>
          <div class="detail-mini-grid">
            <div><span>SKU</span><strong>${item.sku}</strong></div>
            <div><span>Condition</span><strong>${condition.condLabel}</strong></div>
            <div><span>Rating</span><strong>${item.rating ? `${item.rating} stars` : "Not listed"}</strong></div>
            <div><span>Reviews</span><strong>${item.reviews ? item.reviews.toLocaleString() : "Not listed"}</strong></div>
          </div>
        </section>
      </div>

      <div class="detail-bottom-bar">
        <button data-detail-action="back" type="button">Back</button>
        <button data-detail-action="quote" data-id="${id}" type="button">${inQuote ? "In Basket" : "Basket"}</button>
        <button data-detail-action="compare" data-id="${id}" type="button">${inCompare ? "Compared" : "Compare"}</button>
      </div>
    </div>
  `;
}

function handleDetailAction(btn) {
  const { detailAction } = btn.dataset;
  if (detailAction === "back") return closeProductDetail();
  if (detailAction === "copy") {
    navigator.clipboard.writeText(btn.dataset.sku).catch(() => {});
    showToast(`SKU ${btn.dataset.sku} copied!`);
    return;
  }
  if (detailAction === "bb") {
    window.open(btn.dataset.url, "_blank");
    return;
  }
  if (detailAction === "quote") {
    toggleKey(state.quoteKeys, btn.dataset.id);
    syncDetailActions();
    return;
  }
  if (detailAction === "compare") {
    if (!state.comparisonKeys.includes(btn.dataset.id) && state.comparisonKeys.length >= 3) {
      showToast("Compare holds 3 items max");
      return;
    }
    toggleKey(state.comparisonKeys, btn.dataset.id);
    syncDetailActions();
  }
}

function syncDetailActions() {
  renderSalesWorkbench();
  renderProductGrid();
  renderProductDetail();
}

function toggleKey(list, id) {
  const index = list.indexOf(id);
  if (index >= 0) list.splice(index, 1);
  else list.push(id);
}

function buildInventoryRows(item, store) {
  const status = state.isDemoMode ? "Demo open box unit" : "Store-scoped open box";
  return [
    ["Pickup store", `${store.city}, ${store.state} - Store ${store.bbStoreId}`],
    ["Availability", status],
    ["Fulfillment", store.pickup],
    ["Item lookup", `SKU ${item.sku}`],
  ].map(([label, value]) => `
    <div class="detail-inventory-row">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>`).join("");
}

function getConditionDisplay(cond) {
  const map = {
    excellent: { condClass: "cond-exc", condLabel: "Excellent" },
    certified: { condClass: "cond-cert", condLabel: "Certified" },
    good: { condClass: "cond-good", condLabel: "Good" },
  };
  return map[cond] || { condClass: "cond-sat", condLabel: "Satisfactory" };
}

function buildSellNote(item) {
  const savings = `Save $${item.savings.toFixed(2)} (${item.pct}% off).`;
  if (item.cond === "excellent") return `Looks brand new and is the easiest close. Lead with ${savings} Full return window applies.`;
  if (item.cond === "certified") return `Geek Squad certified and passed inspection. ${savings} Position it as the safer open-box choice.`;
  if (item.cond === "good") return `Good condition value play. Set expectations on packaging or light cosmetic wear, then anchor on ${savings}`;
  return `Budget close. Set expectations on cosmetic wear first, then make ${savings} unmistakable.`;
}

function getDetailElement() {
  return document.getElementById("product-detail");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}
