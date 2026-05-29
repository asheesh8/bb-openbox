// ─────────────────────────────────────────────
//  SALES WORKBENCH
//  Renders all right-panel sections: member lookup, membership attach,
//  Best Buy Card offer, compare tray, quote basket, and favorites.
//
//  renderProductGrid is called here after workbench interactions so the
//  card buttons stay in sync. ES modules handle the mutual import fine.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";
import { findProductByKey, getProductKey } from "../utils/productUtils.js";
import { getMembershipCost, getMembershipName, getMembershipBenefits } from "../utils/membershipUtils.js";
import { saveFavoriteProductKeys } from "../services/storageService.js";
import { getSelectedStore } from "./storePanel.js";
import { renderProductGrid } from "./productGrid.js";

// ─── Top-level render ────────────────────────────────────────

export function renderSalesWorkbench() {
  renderMembershipAttach();
  renderMemberPanel();
  renderBestBuyCardOffer();
  renderMicrosoft365Panel();
  renderComparePanel();
  renderQuotePanel();
  renderFavoritesPanel();
}

// ─── Membership Attach ───────────────────────────────────────

function renderMembershipAttach() {
  document.querySelectorAll(".attach-card").forEach(btn =>
    btn.classList.toggle("on", btn.dataset.plan === state.membershipPlan)
  );
  document.getElementById("attach-kicker").textContent =
    state.membershipPlan === "total" ? "Total selected" : "Plus selected";
  document.getElementById("attach-benefits").innerHTML = `
    <div class="attach-benefit-title">${getMembershipName()} key benefits</div>
    <ul class="attach-benefit-list">
      ${getMembershipBenefits().map(b => `<li>${b}</li>`).join("")}
    </ul>
  `;
}

// ─── Member Lookup Panel ─────────────────────────────────────

function renderMemberPanel() {
  const memberState = document.getElementById("member-state");
  const memberMini = document.getElementById("member-mini");
  const memberDetails = document.getElementById("member-details");

  if (state.selectedMember) {
    const m = state.selectedMember;
    memberState.textContent = "Verified";
    memberMini.innerHTML = `
      <span class="member-chip">${m.name}</span>
      <span class="member-chip">${m.tier}</span>
      <span class="member-chip">${m.card}</span>
      <span class="member-chip">Basket ready</span>
    `;
    memberDetails.innerHTML = `
      <div class="member-detail">
        <div class="member-detail-label">Membership</div>
        <div class="member-detail-value good">${m.tier}</div>
      </div>
      <div class="member-detail">
        <div class="member-detail-label">Best Buy Card</div>
        <div class="member-detail-value${m.hasCard ? " good" : ""}">
          ${m.hasCard ? `Active · ${m.cardType}` : "No card on file"}
        </div>
      </div>
      <div class="member-detail">
        <div class="member-detail-label">Rewards</div>
        <div class="member-detail-value">${m.rewards}</div>
      </div>
      <div class="member-detail">
        <div class="member-detail-label">Offer</div>
        <div class="member-detail-value">${m.financing}</div>
      </div>
    `;
  } else {
    memberState.textContent = "Guest";
    memberMini.innerHTML = `
      <span class="member-chip">Basket not started</span>
      <span class="member-chip">Open box eligible</span>
    `;
    memberDetails.innerHTML = `
      <div class="member-detail">
        <div class="member-detail-label">Membership</div>
        <div class="member-detail-value">Lookup needed</div>
      </div>
      <div class="member-detail">
        <div class="member-detail-label">Best Buy Card</div>
        <div class="member-detail-value">Unknown</div>
      </div>
    `;
  }
}

// ─── Best Buy Card Offer Panel ───────────────────────────────

function renderBestBuyCardOffer() {
  const kicker = document.getElementById("card-kicker");
  const body = document.getElementById("card-offer-body");
  const quoteItems = state.quoteKeys.map(findProductByKey).filter(Boolean);
  const store = getSelectedStore();

  // Calculate financing and rewards estimates from the current basket.
  const basketTotal = quoteItems.reduce((sum, i) => sum + i.sale, 0);
  const membershipAttach = quoteItems.length ? getMembershipCost() : 0;
  const financeBase = quoteItems.length ? basketTotal + membershipAttach : 1029.98;
  const monthly12 = financeBase / 12;
  const rewardCredit = financeBase * 0.10;

  const purchaseLine = quoteItems.length
    ? `Financing and store credit estimates include products plus ${getMembershipName()}, before tax.`
    : "Add a product to show exact purchase-specific numbers.";

  const financingLabel = quoteItems.length ? `$${monthly12.toFixed(2)}/mo` : "Example: $83.33/mo";
  const financingSub = quoteItems.length
    ? `for 12 months on $${financeBase.toFixed(2)} before tax, if qualifying financing applies`
    : "on $999.99 product + Plus, before tax, if qualifying financing applies";

  const rewardsLabel = quoteItems.length ? `$${rewardCredit.toFixed(2)}` : "Example: $103.00";
  const rewardsSub = quoteItems.length
    ? `10% back on $${financeBase.toFixed(2)} products + ${getMembershipName()}, before tax`
    : "estimated 10% back on product + membership before tax";

  const valueGrid = `
    <div class="card-value-grid">
      <div class="card-value">
        <div class="card-value-label">Financing</div>
        <div class="card-value-main">${financingLabel}</div>
        <div class="card-value-sub">${financingSub}</div>
      </div>
      <div class="card-value">
        <div class="card-value-label">Store credit</div>
        <div class="card-value-main">${rewardsLabel}</div>
        <div class="card-value-sub">${rewardsSub}</div>
      </div>
    </div>`;

  const standardBenefits = `
    <ul class="card-benefit-list">
      <li>5% back in rewards at Best Buy when choosing standard credit</li>
      <li>Regular no-interest financing options on qualifying purchases $299 and up</li>
    </ul>`;

  if (state.selectedMember?.hasCard) {
    kicker.textContent = "Card active";
    body.innerHTML = `
      <div class="card-offer">
        <div class="card-offer-top">
          <span class="card-brand">my Best Buy Card</span>
          <span class="card-chip"></span>
          <span class="card-network">VISA</span>
        </div>
        <div>
          <div class="card-offer-main big">Card options for this purchase</div>
          <div class="card-offer-sub">${state.selectedMember.cardType} · ${purchaseLine}</div>
        </div>
      </div>
      ${valueGrid}
      ${standardBenefits}
      <ul class="card-benefit-list">
        <li>Customer chooses rewards or financing based on what helps this purchase most</li>
      </ul>`;
  } else {
    kicker.textContent = state.selectedMember ? "Offer available" : "Check account";
    body.innerHTML = `
      <div class="card-offer">
        <div class="card-offer-top">
          <span class="card-brand">my Best Buy Card</span>
          <span class="card-chip"></span>
          <span class="card-network">citi</span>
        </div>
        <div>
          <div class="card-offer-main big">
            ${state.selectedMember ? "If approved, this purchase could be" : "Lookup customer to show card math"}
          </div>
          <div class="card-offer-sub">${purchaseLine}</div>
        </div>
      </div>
      ${valueGrid}
      ${standardBenefits}
      <ul class="card-benefit-list">
        <li>First-day rewards/financing offers depend on approval and eligible promos</li>
      </ul>`;
  }
}

// ─── Microsoft 365 Banner ────────────────────────────────────
//  Rendered as a full-width contextual banner above the product grid
//  (not a workbench panel) so it's visible regardless of scroll position.
//  Shows for both Laptops and Computers — strongest M365 attach departments.

function renderMicrosoft365Panel() {
  const banner = document.getElementById("m365-banner");
  if (!banner) return;

  const show = state.selectedDeptId === "laptops" || state.selectedDeptId === "computers";
  banner.hidden = !show;
  if (!show) { banner.innerHTML = ""; return; }

  const deptLabel = state.selectedDeptId === "laptops" ? "laptop" : "computer";

  banner.innerHTML = `
    <div class="m365-banner-in">
      <div class="m365-hero">
        <div class="m365-icon" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <div>
          <div class="m365-title">Attach Microsoft 365 with every ${deptLabel}</div>
          <div class="m365-copy">Word, Excel, PowerPoint, Outlook, 1 TB OneDrive — ready on day one. Easiest yes on the floor.</div>
        </div>
      </div>
      <div class="m365-pills">
        <div class="m365-pill"><span class="m365-pill-icon">✓</span> Office apps they already know</div>
        <div class="m365-pill"><span class="m365-pill-icon">☁</span> 1 TB cloud backup</div>
        <div class="m365-pill"><span class="m365-pill-icon">🔗</span> Up to 6 devices per family</div>
      </div>
    </div>
  `;
}

// ─── Compare Panel ───────────────────────────────────────────

function renderComparePanel() {
  const compareItems = state.comparisonKeys.map(findProductByKey).filter(Boolean);
  const el = document.getElementById("compare-slots");

  el.innerHTML = compareItems.length
    ? compareItems.map(i => `
        <div class="compare-item">
          <div>
            <div class="compare-name">${i.name}</div>
            <div class="compare-meta">$${i.sale.toFixed(2)} · Save $${i.savings.toFixed(0)} · ${i.cond}</div>
          </div>
          <button class="icon-mini" data-remove-compare="${getProductKey(i)}" type="button">×</button>
        </div>`).join("")
    : `<div class="compare-empty">Tap Compare on up to 3 products</div>`;

  el.querySelectorAll("[data-remove-compare]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.comparisonKeys = state.comparisonKeys.filter(id => id !== btn.dataset.removeCompare);
      renderSalesWorkbench();
      renderProductGrid();
    });
  });
}

// ─── Quote / Basket Panel ────────────────────────────────────

function renderQuotePanel() {
  const quoteItems = state.quoteKeys.map(findProductByKey).filter(Boolean);
  const el = document.getElementById("quote-list");
  const store = getSelectedStore();

  const membershipRow = quoteItems.length
    ? `<div class="quote-row membership">
        <div class="quote-name">${getMembershipName()}</div>
        <div class="quote-price">$${getMembershipCost().toFixed(2)}</div>
        <span class="quote-lock">Attach</span>
       </div>`
    : "";

  el.innerHTML = quoteItems.length
    ? quoteItems.map(i => `
        <div class="quote-row">
          <div class="quote-name">${i.name}</div>
          <div class="quote-price">$${i.sale.toFixed(2)}</div>
          <button class="icon-mini" data-remove-quote="${getProductKey(i)}" type="button">×</button>
        </div>`).join("") + membershipRow
    : `<div class="quote-empty">Add products to build a customer basket</div>`;

  const subtotal = quoteItems.reduce((sum, i) => sum + i.sale, 0);
  const savings = quoteItems.reduce((sum, i) => sum + i.savings, 0);
  const planCost = quoteItems.length ? getMembershipCost() : 0;
  const taxable = subtotal + planCost;
  const tax = taxable * store.tax;
  const estimated = taxable + tax;

  document.getElementById("quote-kicker").textContent = quoteItems.length
    ? `${quoteItems.length} product${quoteItems.length === 1 ? "" : "s"} + attach`
    : "0 items";

  document.getElementById("quote-totals").innerHTML = `
    <div class="quote-total-row"><span>Products</span><strong>$${subtotal.toFixed(2)}</strong></div>
    <div class="quote-total-row"><span>${getMembershipName()}</span><strong>$${planCost.toFixed(2)}</strong></div>
    <div class="quote-total-row tax"><span>Est. tax · ${store.city} ${(store.tax * 100).toFixed(2)}%</span><strong>$${tax.toFixed(2)}</strong></div>
    <div class="quote-total-row"><span>Customer saves</span><strong>$${savings.toFixed(2)}</strong></div>
    <div class="quote-total-row"><span>Estimated basket</span><strong>$${estimated.toFixed(2)}</strong></div>
  `;

  document.getElementById("quote-fab-count").textContent = quoteItems.length;
  document.getElementById("quote-fab-total").textContent = quoteItems.length ? `$${estimated.toFixed(0)}` : "$0";

  el.querySelectorAll("[data-remove-quote]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.quoteKeys = state.quoteKeys.filter(id => id !== btn.dataset.removeQuote);
      renderSalesWorkbench();
      renderProductGrid();
    });
  });
}

// ─── Favorites Panel ─────────────────────────────────────────

function renderFavoritesPanel() {
  // Prune stale keys that no longer exist in the loaded inventory.
  state.favoriteKeys = state.favoriteKeys.filter(id => findProductByKey(id));
  saveFavoriteProductKeys(state.favoriteKeys);

  const favoriteItems = state.favoriteKeys.map(findProductByKey).filter(Boolean);
  const el = document.getElementById("favorite-list");
  document.getElementById("favorite-kicker").textContent = `${favoriteItems.length} saved`;

  el.innerHTML = favoriteItems.length
    ? favoriteItems.map(i => buildFavoriteItemHtml(i)).join("")
    : `<div class="favorite-empty">Tap hearts on products to keep them here</div>`;

  el.querySelectorAll("[data-remove-favorite]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.favoriteKeys = state.favoriteKeys.filter(id => id !== btn.dataset.removeFavorite);
      saveFavoriteProductKeys(state.favoriteKeys);
      renderSalesWorkbench();
      renderProductGrid();
    });
  });
}

function buildFavoriteItemHtml(item) {
  const dept = DEPTS.find(d => d.id === item.category);
  const thumb = item.img
    ? `<img src="${item.img}" alt="" onerror="this.style.display='none';this.parentElement.textContent='${dept?.icon || "📦"}'"/>`
    : `${dept?.icon || "📦"}`;

  return `
    <div class="favorite-item">
      <div class="favorite-thumb">${thumb}</div>
      <div>
        <div class="favorite-name">${item.name}</div>
        <div class="favorite-meta">$${item.sale.toFixed(2)} · Save $${item.savings.toFixed(0)} · ${item.cond}</div>
      </div>
      <button class="icon-mini" data-remove-favorite="${getProductKey(item)}" type="button">×</button>
    </div>`;
}
