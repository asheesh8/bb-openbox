import { DEPTS } from "./config/productDepartments.js";
import { STORES } from "./config/storeLocations.js";
import { DEMO_ITEMS } from "./data/sampleOpenBoxItems.js";
import { fetchOpenBoxInventory, verifyBestBuyApiKey } from "./services/bestBuyInventoryApi.js";

// ─────────────────────────────────────────────
//  APP STATE
//  These variables remember what the associate is currently viewing or building.
// ─────────────────────────────────────────────
let bestBuyApiKey = localStorage.getItem("bb_key") || "";
let isDemoMode = false;
let allOpenBoxProducts = [];
let selectedDepartmentId = DEPTS[0].id;
let selectedFilters = {};
let searchText = "";
let sortMode = "savings";
let expandedProductKey = null;
let lastInventoryFetchAt = null;
let selectedStoreId = localStorage.getItem("bb_store") || "360";
let signedInRole = "";
let comparisonProductKeys = [];
let quoteProductKeys = [];
let favoriteProductKeys = loadFavoriteProductKeys();
let selectedMembershipPlan = "plus";
let selectedMember = null;
let savedInstallPromptEvent = null;
let demoCardOnFileToggle = false;

// ─────────────────────────────────────────────
//  STARTUP AND MAIN BUTTON EVENTS
//  This section connects the page buttons to the app behavior.
// ─────────────────────────────────────────────
if (bestBuyApiKey) {
  document.getElementById("gate").style.display = "none";
  startOpenBoxFinder(false);
} else {
  document.getElementById("gate").style.display = "flex";
}

registerServiceWorker();
setupAppInstallPrompt();

document.getElementById("gate-btn").addEventListener("click", async () => {
  const key = document.getElementById("api-key").value.trim();
  if (!key) return showGateError("Please paste your API key.");
  const btn = document.getElementById("gate-btn");
  btn.disabled = true; btn.textContent = "Verifying…";
  if (await verifyApiKey(key)) {
    bestBuyApiKey = key;
    localStorage.setItem("bb_key", key);
    document.getElementById("gate").style.display = "none";
    startOpenBoxFinder(false);
  } else {
    btn.disabled = false; btn.textContent = "Connect →";
    showGateError("Invalid key or network error. Try again.");
  }
});

document.getElementById("demo-btn").addEventListener("click", () => {
  document.getElementById("gate").style.display = "none";
  startOpenBoxFinder(true);
});

document.getElementById("gate-more-toggle").addEventListener("click", () => {
  const panel = document.getElementById("gate-more");
  const isOpen = panel.classList.toggle("open");
  document.getElementById("gate-more-toggle").setAttribute("aria-expanded", String(isOpen));
});

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
    signedInRole = "Sales";
    document.getElementById("gate").style.display = "none";
    startOpenBoxFinder(true);
    showToastMessage("Demo SSO session started");
  }, 650);
});

document.getElementById("store-select").addEventListener("change", async e => {
  selectedStoreId = e.target.value;
  localStorage.setItem("bb_store", selectedStoreId);
  renderStoreSummary();
  renderSalesWorkbench();
  if (!isDemoMode && allOpenBoxProducts.length) {
    const btn = document.getElementById("refresh-btn");
    btn.classList.add("spin");
    allOpenBoxProducts = await loadLiveInventory();
    btn.classList.remove("spin");
    lastInventoryFetchAt = new Date();
    renderInventoryStatus();
    renderProductGrid();
    showToastMessage(`Inventory scoped to ${getSelectedStore().city}`);
  }
});

document.getElementById("settings-btn").addEventListener("click", () => {
  localStorage.removeItem("bb_key");
  location.reload();
});

document.getElementById("member-lookup-btn").addEventListener("click", () => {
  const raw = document.getElementById("member-input").value.trim();
  demoCardOnFileToggle = !demoCardOnFileToggle;
  selectedMember = {
    name: "Jordan M.",
    handle: raw || "802-555-0136",
    tier: "My Best Buy Plus",
    hasCard: demoCardOnFileToggle,
    card: demoCardOnFileToggle ? "Best Buy Card on file" : "No Best Buy Card",
    cardType: demoCardOnFileToggle ? "Visa ending 4421" : "",
    rewards: "$15 rewards",
    financing: demoCardOnFileToggle ? "12-mo financing eligible" : "Card offer available",
  };
  renderSalesWorkbench();
  showToastMessage("Demo member basket opened");
});

document.querySelectorAll(".attach-card").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedMembershipPlan = btn.dataset.plan;
    renderSalesWorkbench();
  });
});

document.getElementById("clear-sales-btn").addEventListener("click", () => {
  comparisonProductKeys = [];
  quoteProductKeys = [];
  selectedMember = null;
  document.getElementById("member-input").value = "";
  renderSalesWorkbench();
  renderProductGrid();
});

document.getElementById("copy-quote-btn").addEventListener("click", () => {
  const text = createQuoteClipboardText();
  navigator.clipboard.writeText(text).catch(() => {});
  showToastMessage("Quote copied for customer recap");
});

document.getElementById("clear-favorites-btn").addEventListener("click", () => {
  favoriteProductKeys = [];
  saveFavoriteProductKeys();
  renderSalesWorkbench();
  renderProductGrid();
  showToastMessage("Favorites cleared");
});

document.getElementById("copy-favorites-btn").addEventListener("click", () => {
  const text = createFavoritesClipboardText();
  navigator.clipboard.writeText(text).catch(() => {});
  showToastMessage(favoriteProductKeys.length ? "Favorites list copied" : "No favorites to copy");
});

document.getElementById("quote-fab").addEventListener("click", () => {
  document.getElementById("quote-panel").scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
});

async function verifyApiKey(k) {
  return verifyBestBuyApiKey(k);
}

// Starts either the live API version or the sample-data demo version.
async function startOpenBoxFinder(demo) {
  isDemoMode = demo;
  const loading = document.getElementById("loading");
  loading.style.display = "flex";

  if (!demo) {
    document.getElementById("load-label").textContent = "Fetching live open box inventory…";
    document.getElementById("load-cat").textContent = "Connecting to Best Buy API";
    allOpenBoxProducts = await loadLiveInventory();
  } else {
    allOpenBoxProducts = DEMO_ITEMS;
    await new Promise(r => setTimeout(r, 600));
  }

  loading.style.display = "none";
  document.getElementById("app").classList.add("on");
  lastInventoryFetchAt = new Date();

  renderStoreDropdown();
  renderStoreSummary();
  renderDepartmentTabs();
  resetFiltersForSelectedDepartment();
  renderDepartmentFilters();
  renderProductGrid();
  renderSalesWorkbench();
  renderInventoryStatus();
}

// ─────────────────────────────────────────────
//  INVENTORY LOADING
//  Live inventory comes from the Best Buy API service module.
// ─────────────────────────────────────────────
async function loadLiveInventory() {
  return fetchOpenBoxInventory({
    apiKey: bestBuyApiKey,
    store: getSelectedStore(),
    onStatus: status => {
      document.getElementById("load-cat").textContent = status;
    },
  });
}

document.getElementById("refresh-btn").addEventListener("click", async () => {
  if (isDemoMode) { showToastMessage("Sample data — add API key to refresh live"); return; }
  const btn = document.getElementById("refresh-btn");
  btn.classList.add("spin");
  allOpenBoxProducts = await loadLiveInventory();
  lastInventoryFetchAt = new Date();
  btn.classList.remove("spin");
  renderInventoryStatus();
  renderProductGrid();
  showToastMessage("Inventory refreshed!");
});

// ─────────────────────────────────────────────
//  STORE CONTEXT
//  Store choice controls tax, store label, and live inventory scope.
// ─────────────────────────────────────────────
function getSelectedStore() {
  return STORES.find(s => s.id === selectedStoreId) || STORES[0];
}

function renderStoreDropdown() {
  const select = document.getElementById("store-select");
  select.innerHTML = STORES.map(s => `<option value="${s.id}"${s.id === selectedStoreId ? " selected" : ""}>${s.label}</option>`).join("");
}

function renderStoreSummary() {
  const store = getSelectedStore();
  const role = signedInRole ? ` · ${signedInRole}` : "";
  document.getElementById("tb-store").textContent = `Store ${store.bbStoreId}${role}`;
  document.getElementById("store-kicker").textContent = `${(store.tax * 100).toFixed(2)}% tax`;
  document.getElementById("store-facts").innerHTML = `
    <div class="store-fact"><span>Location</span><strong>${store.city}, ${store.state}</strong></div>
    <div class="store-fact"><span>Store ID</span><strong>${store.bbStoreId}</strong></div>
    <div class="store-fact"><span>Sales tax</span><strong>${(store.tax * 100).toFixed(2)}%</strong></div>
    <div class="store-fact"><span>Fulfillment</span><strong>${store.pickup}</strong></div>
  `;
}

// ─────────────────────────────────────────────
//  DEPARTMENT NAVIGATION
//  Departments decide which filters and products are shown.
// ─────────────────────────────────────────────
function renderDepartmentTabs() {
  const el = document.getElementById("dept-tabs");
  el.innerHTML = DEPTS.map(d => `
    <button class="dept-tab${d.id === selectedDepartmentId ? " active" : ""}" data-dept="${d.id}">
      <span class="dt-icon">${d.icon}</span>
      <span class="dt-label">${d.label}</span>
    </button>
  `).join("");
  el.querySelectorAll(".dept-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedDepartmentId = btn.dataset.dept;
      expandedProductKey = null;
      el.querySelectorAll(".dept-tab").forEach(b => b.classList.toggle("active", b.dataset.dept === selectedDepartmentId));
      resetFiltersForSelectedDepartment();
      renderDepartmentFilters();
      renderProductGrid();
    });
  });
}

function resetFiltersForSelectedDepartment() {
  selectedFilters = {};
  const dept = DEPTS.find(d => d.id === selectedDepartmentId);
  if (dept) dept.filters.forEach(f => { selectedFilters[f.id] = "All"; });
  selectedFilters.condition = "All";
  sortMode = "savings";
}

// ─────────────────────────────────────────────
//  FILTER BUTTONS
//  Rebuilds the filter pills whenever the department changes.
// ─────────────────────────────────────────────
function renderDepartmentFilters() {
  const dept = DEPTS.find(d => d.id === selectedDepartmentId);
  const el = document.getElementById("dept-filters");
  if (!dept) { el.innerHTML = ""; return; }

  let html = "";
  dept.filters.forEach((f, i) => {
    if (i > 0) html += `<div class="filter-sep"></div>`;
    html += `<div class="filter-group">`;
    html += `<span class="filter-group-label">${f.label}</span>`;
    f.opts.forEach(opt => {
      const isOn = selectedFilters[f.id] === opt;
      html += `<button class="pill-btn${isOn ? " on" : ""}" data-filter="${f.id}" data-val="${opt}">${opt}</button>`;
    });
    html += `</div>`;
  });

  html += `<div class="filter-sep"></div>`;
  html += `<div class="filter-group">`;
  html += `<span class="filter-group-label">Condition</span>`;
  ["All","Excellent","Certified","Good","Satisfactory"].forEach(opt => {
    const isOn = selectedFilters.condition === opt;
    html += `<button class="pill-btn${isOn ? " on" : ""}" data-filter="condition" data-val="${opt}">${opt}</button>`;
  });
  html += `</div>`;

  // The sort dropdown is always visible no matter which department is selected.
  html += `<div class="filter-sep"></div>`;
  html += `<select class="sort-select" id="sort-select">
    <option value="savings"${sortMode==="savings"?" selected":""}>Biggest sale</option>
    <option value="pct"${sortMode==="pct"?" selected":""}>% off</option>
    <option value="price_asc"${sortMode==="price_asc"?" selected":""}>Price increasing</option>
    <option value="price_desc"${sortMode==="price_desc"?" selected":""}>Price decreasing</option>
    <option value="rating"${sortMode==="rating"?" selected":""}>By rating</option>
  </select>`;

  el.innerHTML = html;

  el.querySelectorAll(".pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      const v = btn.dataset.val;
      selectedFilters[f] = v;
      el.querySelectorAll(`.pill-btn[data-filter="${f}"]`).forEach(b => b.classList.toggle("on", b.dataset.val === v));
      renderProductGrid();
    });
  });

  const ss = el.querySelector("#sort-select");
  if (ss) ss.addEventListener("change", e => { sortMode = e.target.value; renderProductGrid(); });
}

// ─────────────────────────────────────────────
//  PRODUCT SEARCH, FILTER, AND SORT
//  This produces the exact list that should be visible in the grid.
// ─────────────────────────────────────────────
function getVisibleProducts() {
  const dept = DEPTS.find(d => d.id === selectedDepartmentId);
  let items = allOpenBoxProducts.filter(i => i.category === selectedDepartmentId);

  // Apply the filters that belong to the selected department.
  if (dept) {
    dept.filters.forEach(f => {
      const val = selectedFilters[f.id];
      if (!val || val === "All") return;
      if (f.id === "brand") {
        items = items.filter(i => i.brand === val);
      } else if (f.id === "ram") {
        items = items.filter(i => i.specs.some(s => s.toLowerCase().includes(val.toLowerCase())));
      } else if (f.id === "storage") {
        items = items.filter(i => i.specs.some(s => s.toLowerCase().includes(val.toLowerCase())));
      } else if (f.id === "size") {
        items = items.filter(i => {
          const sizeSpec = i.specs.find(s => s.includes('"'));
          if (!sizeSpec) return false;
          const sz = parseFloat(sizeSpec);
          if (val === 'Under 50"') return sz < 50;
          if (val === '50–65"') return sz >= 50 && sz < 65;
          if (val === '65–75"') return sz >= 65 && sz < 75;
          if (val === '75"+') return sz >= 75;
          return true;
        });
      } else if (f.id === "type") {
        const needle = val.toLowerCase().replace(/s$/, "");
        items = items.filter(i =>
          i.specs.some(s => s.toLowerCase().replace(/s$/, "").includes(needle)) ||
          i.name.toLowerCase().replace(/s\b/g, "").includes(needle)
        );
      }
    });
  }

  const condition = selectedFilters.condition;
  if (condition && condition !== "All") {
    items = items.filter(i => i.cond.toLowerCase() === condition.toLowerCase());
  }

  // Search checks product names, SKUs, brands, and parsed specs.
  if (searchText) {
    const s = searchText.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(s) ||
      String(i.sku).includes(s) ||
      i.brand.toLowerCase().includes(s) ||
      i.specs.some(spec => spec.toLowerCase().includes(s))
    );
  }

  // Sort the final visible list for the associate.
  items.sort((a, b) => {
    if (sortMode === "savings") return b.savings - a.savings;
    if (sortMode === "pct") return b.pct - a.pct;
    if (sortMode === "price_asc") return a.sale - b.sale;
    if (sortMode === "price_desc") return b.sale - a.sale;
    if (sortMode === "rating") return b.rating - a.rating;
    return 0;
  });

  return items;
}

function getProductKey(item) {
  return `${item.sku}-${item.cond}`;
}

function findProductByKey(id) {
  return allOpenBoxProducts.find(i => getProductKey(i) === id);
}

// Reads saved favorites from localStorage and protects the app from bad data.
function loadFavoriteProductKeys() {
  try {
    const parsed = JSON.parse(localStorage.getItem("bb_favorites") || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveFavoriteProductKeys() {
  localStorage.setItem("bb_favorites", JSON.stringify(favoriteProductKeys));
}

// Returns the price of the currently selected membership attachment.
function getMembershipCost() {
  return selectedMembershipPlan === "total" ? 199.99 : 29.99;
}

function getMembershipName() {
  return selectedMembershipPlan === "total" ? "My Best Buy Total" : "My Best Buy Plus";
}

function getMembershipBenefits() {
  if (selectedMembershipPlan === "total") {
    return [
      "All My Best Buy Plus benefits included",
      "Up to 2 yrs product protection + AppleCare+",
      "Protection plans renewable after 2 yrs (TVs, laptops)",
      "24/7 tech support — in-store & remote",
      "VIP member support",
      "20% off repairs",
    ];
  }
  return [
    "1% back in rewards on Best Buy purchases",
    "Exclusive member prices on thousands of items",
    "Extended 60-day return & exchange window",
    "Exclusive access to sales, events & products",
    "Free 2-day shipping on eligible items",
  ];
}

// Updates the Best Buy Card panel using the current basket and member lookup.
function renderBestBuyCardOffer() {
  const kicker = document.getElementById("card-kicker");
  const body = document.getElementById("card-offer-body");
  const quoteItems = quoteProductKeys.map(findProductByKey).filter(Boolean);
  const basketTotal = quoteItems.reduce((sum, i) => sum + i.sale, 0);
  const membershipAttach = quoteItems.length ? getMembershipCost() : 0;
  const financeBase = quoteItems.length ? basketTotal + membershipAttach : 1029.98;
  const monthly12 = financeBase / 12;
  const rewardBase = quoteItems.length ? financeBase : 1029.98;
  const rewardCredit = rewardBase * 0.10;
  const purchaseLine = quoteItems.length
    ? `Financing and store credit estimates include products plus ${getMembershipName()}, before tax.`
    : "Add a product to show exact purchase-specific numbers.";
  const financingLabel = quoteItems.length
    ? `$${monthly12.toFixed(2)}/mo`
    : "Example: $83.33/mo";
  const financingSub = quoteItems.length
    ? `for 12 months on $${financeBase.toFixed(2)} before tax, if qualifying financing applies`
    : "on $999.99 product + Plus, before tax, if qualifying financing applies";
  const rewardsLabel = quoteItems.length
    ? `$${rewardCredit.toFixed(2)}`
    : "Example: $103.00";
  const rewardsSub = quoteItems.length
    ? `10% back on $${rewardBase.toFixed(2)} products + ${getMembershipName()}, before tax`
    : "estimated 10% back on product + membership before tax";
  if (selectedMember?.hasCard) {
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
          <div class="card-offer-sub">${selectedMember.cardType} · ${purchaseLine}</div>
        </div>
      </div>
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
      </div>
      <ul class="card-benefit-list">
        <li>5% back in rewards at Best Buy when choosing standard credit</li>
        <li>Regular no-interest financing options on qualifying purchases $299 and up</li>
        <li>Customer chooses rewards or financing based on what helps this purchase most</li>
      </ul>
    `;
  } else {
    kicker.textContent = selectedMember ? "Offer available" : "Check account";
    body.innerHTML = `
      <div class="card-offer">
        <div class="card-offer-top">
          <span class="card-brand">my Best Buy Card</span>
          <span class="card-chip"></span>
          <span class="card-network">citi</span>
        </div>
        <div>
          <div class="card-offer-main big">${selectedMember ? "If approved, this purchase could be" : "Lookup customer to show card math"}</div>
          <div class="card-offer-sub">${purchaseLine}</div>
        </div>
      </div>
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
      </div>
      <ul class="card-benefit-list">
        <li>5% back in rewards at Best Buy when choosing standard credit</li>
        <li>Regular no-interest financing options on qualifying purchases $299 and up</li>
        <li>First-day rewards/financing offers depend on approval and eligible promos</li>
      </ul>
    `;
  }
}

// Rebuilds the sales panels: member lookup, attach, card, compare, quote, favorites.
function renderSalesWorkbench() {
  document.querySelectorAll(".attach-card").forEach(btn => btn.classList.toggle("on", btn.dataset.plan === selectedMembershipPlan));
  document.getElementById("attach-kicker").textContent = selectedMembershipPlan === "total" ? "Total selected" : "Plus selected";
  document.getElementById("attach-benefits").innerHTML = `
    <div class="attach-benefit-title">${getMembershipName()} key benefits</div>
    <ul class="attach-benefit-list">
      ${getMembershipBenefits().map(b => `<li>${b}</li>`).join("")}
    </ul>
  `;

  const memberState = document.getElementById("member-state");
  const memberMini = document.getElementById("member-mini");
  const memberDetails = document.getElementById("member-details");
  if (selectedMember) {
    memberState.textContent = "Verified";
    memberMini.innerHTML = `
      <span class="member-chip">${selectedMember.name}</span>
      <span class="member-chip">${selectedMember.tier}</span>
      <span class="member-chip">${selectedMember.card}</span>
      <span class="member-chip">Basket ready</span>
    `;
    memberDetails.innerHTML = `
      <div class="member-detail">
        <div class="member-detail-label">Membership</div>
        <div class="member-detail-value good">${selectedMember.tier}</div>
      </div>
      <div class="member-detail">
        <div class="member-detail-label">Best Buy Card</div>
        <div class="member-detail-value${selectedMember.hasCard ? " good" : ""}">${selectedMember.hasCard ? `Active · ${selectedMember.cardType}` : "No card on file"}</div>
      </div>
      <div class="member-detail">
        <div class="member-detail-label">Rewards</div>
        <div class="member-detail-value">${selectedMember.rewards}</div>
      </div>
      <div class="member-detail">
        <div class="member-detail-label">Offer</div>
        <div class="member-detail-value">${selectedMember.financing}</div>
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
  renderBestBuyCardOffer();

  const compareItems = comparisonProductKeys.map(findProductByKey).filter(Boolean);
  const compareSlots = document.getElementById("compare-slots");
  compareSlots.innerHTML = compareItems.length ? compareItems.map(i => `
    <div class="compare-item">
      <div>
        <div class="compare-name">${i.name}</div>
        <div class="compare-meta">$${i.sale.toFixed(2)} · Save $${i.savings.toFixed(0)} · ${i.cond}</div>
      </div>
      <button class="icon-mini" data-remove-compare="${getProductKey(i)}" type="button">×</button>
    </div>
  `).join("") : `<div class="compare-empty">Tap Compare on up to 3 products</div>`;

  const quoteItems = quoteProductKeys.map(findProductByKey).filter(Boolean);
  const quoteList = document.getElementById("quote-list");
  const membershipRow = quoteItems.length ? `
    <div class="quote-row membership">
      <div class="quote-name">${getMembershipName()}</div>
      <div class="quote-price">$${getMembershipCost().toFixed(2)}</div>
      <span class="quote-lock">Attach</span>
    </div>
  ` : "";
  quoteList.innerHTML = quoteItems.length ? quoteItems.map(i => `
    <div class="quote-row">
      <div class="quote-name">${i.name}</div>
      <div class="quote-price">$${i.sale.toFixed(2)}</div>
      <button class="icon-mini" data-remove-quote="${getProductKey(i)}" type="button">×</button>
    </div>
  `).join("") + membershipRow : `<div class="quote-empty">Add products to build a customer basket</div>`;

  const subtotal = quoteItems.reduce((sum, i) => sum + i.sale, 0);
  const savings = quoteItems.reduce((sum, i) => sum + i.savings, 0);
  const planCost = quoteItems.length ? getMembershipCost() : 0;
  const taxable = subtotal + planCost;
  const tax = taxable * getSelectedStore().tax;
  const estimated = taxable + tax;
  document.getElementById("quote-kicker").textContent = quoteItems.length ? `${quoteItems.length} product${quoteItems.length === 1 ? "" : "s"} + attach` : "0 items";
  document.getElementById("quote-totals").innerHTML = `
    <div class="quote-total-row"><span>Products</span><strong>$${subtotal.toFixed(2)}</strong></div>
    <div class="quote-total-row"><span>${getMembershipName()}</span><strong>$${planCost.toFixed(2)}</strong></div>
    <div class="quote-total-row tax"><span>Est. tax · ${getSelectedStore().city} ${(getSelectedStore().tax * 100).toFixed(2)}%</span><strong>$${tax.toFixed(2)}</strong></div>
    <div class="quote-total-row"><span>Customer saves</span><strong>$${savings.toFixed(2)}</strong></div>
    <div class="quote-total-row"><span>Estimated basket</span><strong>$${estimated.toFixed(2)}</strong></div>
  `;
  document.getElementById("quote-fab-count").textContent = quoteItems.length;
  document.getElementById("quote-fab-total").textContent = quoteItems.length ? `$${estimated.toFixed(0)}` : "$0";

  document.querySelectorAll("[data-remove-compare]").forEach(btn => {
    btn.addEventListener("click", () => {
      comparisonProductKeys = comparisonProductKeys.filter(id => id !== btn.dataset.removeCompare);
      renderSalesWorkbench();
      renderProductGrid();
    });
  });
  document.querySelectorAll("[data-remove-quote]").forEach(btn => {
    btn.addEventListener("click", () => {
      quoteProductKeys = quoteProductKeys.filter(id => id !== btn.dataset.removeQuote);
      renderSalesWorkbench();
      renderProductGrid();
    });
  });

  favoriteProductKeys = favoriteProductKeys.filter(id => findProductByKey(id));
  saveFavoriteProductKeys();
  const favoriteItems = favoriteProductKeys.map(findProductByKey).filter(Boolean);
  const favoriteList = document.getElementById("favorite-list");
  document.getElementById("favorite-kicker").textContent = `${favoriteItems.length} saved`;
  favoriteList.innerHTML = favoriteItems.length ? favoriteItems.map(i => {
    const dept = DEPTS.find(d => d.id === i.category);
    const thumb = i.img
      ? `<img src="${i.img}" alt="" onerror="this.style.display='none';this.parentElement.textContent='${dept?.icon || "📦"}'"/>`
      : `${dept?.icon || "📦"}`;
    return `
      <div class="favorite-item">
        <div class="favorite-thumb">${thumb}</div>
        <div>
          <div class="favorite-name">${i.name}</div>
          <div class="favorite-meta">$${i.sale.toFixed(2)} · Save $${i.savings.toFixed(0)} · ${i.cond}</div>
        </div>
        <button class="icon-mini" data-remove-favorite="${getProductKey(i)}" type="button">×</button>
      </div>
    `;
  }).join("") : `<div class="favorite-empty">Tap hearts on products to keep them here</div>`;

  document.querySelectorAll("[data-remove-favorite]").forEach(btn => {
    btn.addEventListener("click", () => {
      favoriteProductKeys = favoriteProductKeys.filter(id => id !== btn.dataset.removeFavorite);
      saveFavoriteProductKeys();
      renderSalesWorkbench();
      renderProductGrid();
    });
  });
}

// Creates the plain-text quote that gets copied for customer recap.
function createQuoteClipboardText() {
  const quoteItems = quoteProductKeys.map(findProductByKey).filter(Boolean);
  if (!quoteItems.length) return "Open Box Finder quote: no products added yet.";
  const lines = quoteItems.map(i => `${i.name} - $${i.sale.toFixed(2)} open box (${i.cond}), save $${i.savings.toFixed(2)}. SKU ${i.sku}`);
  const subtotal = quoteItems.reduce((sum, i) => sum + i.sale, 0);
  const savings = quoteItems.reduce((sum, i) => sum + i.savings, 0);
  const store = getSelectedStore();
  const taxable = subtotal + getMembershipCost();
  const tax = taxable * store.tax;
  return [
    `Open Box Finder quote${selectedMember ? ` for ${selectedMember.name}` : ""} · Store ${store.bbStoreId} ${store.city}, ${store.state}:`,
    ...lines,
    `${getMembershipName()}: $${getMembershipCost().toFixed(2)}/yr`,
    `Estimated tax (${(store.tax * 100).toFixed(2)}%): $${tax.toFixed(2)}`,
    `Estimated basket: $${(taxable + tax).toFixed(2)}`,
    `Open box savings: $${savings.toFixed(2)}`,
  ].join("\n");
}

// Creates a shareable text list from the saved favorites.
function createFavoritesClipboardText() {
  const favoriteItems = favoriteProductKeys.map(findProductByKey).filter(Boolean);
  if (!favoriteItems.length) return "Open Box Finder favorites: no products saved yet.";
  const store = getSelectedStore();
  return [
    `Open Box Finder favorites · Store ${store.bbStoreId} ${store.city}, ${store.state}:`,
    ...favoriteItems.map(i => `${i.name} - $${i.sale.toFixed(2)} open box (${i.cond}), save $${i.savings.toFixed(2)}. SKU ${i.sku}`),
  ].join("\n");
}

// Escapes text before inserting user-controlled strings into HTML.
function escapeHtmlText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

// Builds the small filter chips shown above the product grid.
function getActiveFilterLabels() {
  const chips = [];
  const dept = DEPTS.find(d => d.id === selectedDepartmentId);
  if (dept) {
    dept.filters.forEach(f => {
      const value = selectedFilters[f.id];
      if (value && value !== "All") chips.push({ label: f.label, value });
    });
  }
  if (selectedFilters.condition && selectedFilters.condition !== "All") {
    chips.push({ label: "Condition", value: selectedFilters.condition });
  }
  if (searchText.trim()) {
    chips.push({ label: "Search", value: searchText.trim() });
  }
  return chips;
}

// ─────────────────────────────────────────────
//  PRODUCT GRID
//  Renders product cards and attaches card-level click handlers.
// ─────────────────────────────────────────────
function renderProductGrid() {
  const items = getVisibleProducts();
  const grid = document.getElementById("product-grid");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("results-count");

  const filterChips = getActiveFilterLabels();
  const filterHtml = filterChips.length
    ? filterChips.map(chip => `<span class="results-filter">${escapeHtmlText(chip.label)} <b>${escapeHtmlText(chip.value)}</b></span>`).join("")
    : `<span class="results-filter">Showing <b>all ${escapeHtmlText(DEPTS.find(d=>d.id===selectedDepartmentId)?.label || "deals")}</b></span>`;
  count.innerHTML = `
    <div><strong>${items.length}</strong> open box deal${items.length !== 1 ? "s" : ""} in ${DEPTS.find(d=>d.id===selectedDepartmentId)?.label||""}</div>
    <div class="results-filters">${filterHtml}</div>
  `;

  if (!items.length) {
    grid.innerHTML = "";
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  grid.innerHTML = items.map(item => {
    const id = getProductKey(item);
    const isExp = expandedProductKey === id;
    const isHot = item.pct >= 35 || item.savings >= 600;
    const dept = DEPTS.find(d => d.id === item.category);
    const inCompare = comparisonProductKeys.includes(id);
    const inQuote = quoteProductKeys.includes(id);
    const isFavorite = favoriteProductKeys.includes(id);

    const condClass = item.cond === "excellent" ? "cond-exc" : item.cond === "certified" ? "cond-cert" : item.cond === "good" ? "cond-good" : "cond-sat";
    const condLabel = item.cond === "excellent" ? "Excellent" : item.cond === "certified" ? "Certified" : item.cond === "good" ? "Good" : "Satisfactory";

    const specsHtml = item.specs.map(s => `<span class="spec-chip">${s}</span>`).join("");

    const sellNote = (() => {
      const s = `<strong>Save $${item.savings.toFixed(2)} (${item.pct}% off)</strong>`;
      if (item.cond === "excellent") return `Looks brand new — easiest close. Lead with ${s}. Full return window applies.`;
      if (item.cond === "certified") return `Geek Squad certified — passed inspection. ${s}. Arguably safer than standard open box.`;
      if (item.cond === "good") return `Good condition value play — be upfront that packaging or light cosmetic wear may show, then anchor on ${s}.`;
      return `Budget close — set expectations on cosmetic wear first, then make the savings unmistakable with ${s}.`;
    })();

    return `<div class="pcard${isExp ? " expanded" : ""}" data-id="${id}">
      <div class="pc-img-wrap">
        ${item.img
          ? `<img class="pc-img" src="${item.img}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/><div class="pc-img-placeholder" style="display:none">${dept?.icon||"📦"}</div>`
          : `<div class="pc-img-placeholder">${dept?.icon||"📦"}</div>`
        }
        <div class="pc-cond-badge ${condClass}">${condLabel}</div>
        <button class="favorite-toggle${isFavorite ? " on" : ""}" data-id="${id}" data-action="favorite" type="button" aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}" title="${isFavorite ? "Remove from favorites" : "Add to favorites"}">♥</button>
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
      <div class="pc-expand${isExp ? " open" : ""}">
        <div class="pc-expand-in">
          <div class="expand-section">
            <div class="expand-label">Price Breakdown</div>
            <div class="price-breakdown">
              <div class="pb-row"><span class="pb-label">New price</span><span class="pb-val strike">$${item.reg.toFixed(2)}</span></div>
              <div class="pb-row"><span class="pb-label">Open box price</span><span class="pb-val blue">$${item.sale.toFixed(2)}</span></div>
              <div class="pb-row"><span class="pb-label">You save</span><span class="pb-val green">$${item.savings.toFixed(2)} (${item.pct}% off)</span></div>
              <div class="pb-row"><span class="pb-label">Condition</span><span class="pb-val">${condLabel}</span></div>
              ${item.rating ? `<div class="pb-row"><span class="pb-label">Customer rating</span><span class="pb-val">${item.rating} ★ (${item.reviews.toLocaleString()} reviews)</span></div>` : ""}
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
  }).join("");

  // Product cards are rebuilt often, so their click handlers are attached here too.
  grid.querySelectorAll(".pcard").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest("[data-action]")) return;
      const id = card.dataset.id;
      expandedProductKey = expandedProductKey === id ? null : id;
      renderProductGrid();
    });
  });

  grid.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === "copy") {
        navigator.clipboard.writeText(btn.dataset.sku).catch(() => {});
        showToastMessage(`SKU ${btn.dataset.sku} copied!`);
      } else if (action === "compare") {
        const id = btn.dataset.id;
        if (comparisonProductKeys.includes(id)) {
          comparisonProductKeys = comparisonProductKeys.filter(x => x !== id);
        } else if (comparisonProductKeys.length < 3) {
          comparisonProductKeys.push(id);
        } else {
          showToastMessage("Compare holds 3 items max");
          return;
        }
        renderSalesWorkbench();
        renderProductGrid();
      } else if (action === "quote") {
        const id = btn.dataset.id;
        if (quoteProductKeys.includes(id)) {
          quoteProductKeys = quoteProductKeys.filter(x => x !== id);
        } else {
          quoteProductKeys.push(id);
        }
        renderSalesWorkbench();
        renderProductGrid();
      } else if (action === "favorite") {
        const id = btn.dataset.id;
        if (favoriteProductKeys.includes(id)) {
          favoriteProductKeys = favoriteProductKeys.filter(x => x !== id);
          showToastMessage("Removed from favorites");
        } else {
          favoriteProductKeys.push(id);
          showFavoriteSavedMessage();
        }
        saveFavoriteProductKeys();
        renderSalesWorkbench();
        renderProductGrid();
      } else if (action === "lpn") {
        document.getElementById("lpn-modal").classList.add("open");
      } else if (action === "link") {
        window.open(btn.dataset.url, "_blank");
      }
    });
  });
  renderSalesWorkbench();
}

function renderInventoryStatus() {
  const el = document.getElementById("live-indicator");
  if (isDemoMode) {
    el.innerHTML = `<span class="live-dot demo-dot">Sample data</span>`;
  } else {
    const t = lastInventoryFetchAt ? lastInventoryFetchAt.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "–";
    el.innerHTML = `<span class="live-dot">Live · Updated ${t}</span>`;
  }
}

// ─────────────────────────────────────────────
//  SEARCH BOX
// ─────────────────────────────────────────────
document.getElementById("search-inp").addEventListener("input", e => {
  searchText = e.target.value;
  renderProductGrid();
});

// ─────────────────────────────────────────────
//  AI DEAL ADVISOR
//  Uses the external advisor in live mode and the local helper in demo mode.
// ─────────────────────────────────────────────
const aiOv = document.getElementById("ai-ov");
document.getElementById("ai-open-btn").addEventListener("click", () => aiOv.classList.add("open"));
document.getElementById("ai-btn-ctrl").addEventListener("click", () => aiOv.classList.add("open"));
document.getElementById("ai-close").addEventListener("click", () => aiOv.classList.remove("open"));
aiOv.addEventListener("click", e => { if (e.target === aiOv) aiOv.classList.remove("open"); });

document.querySelectorAll(".ai-qchip").forEach(c => {
  c.addEventListener("click", () => { document.getElementById("ai-ta").value = c.dataset.q; });
});

document.getElementById("ai-go").addEventListener("click", async () => {
  const query = document.getElementById("ai-ta").value.trim();
  const btn = document.getElementById("ai-go");
  const load = document.getElementById("ai-loading");
  const res = document.getElementById("ai-result");
  btn.disabled = true; load.classList.add("open"); res.classList.remove("open");

  const items = getVisibleProducts().slice(0, 10);
  const inv = items.map(i =>
    `- ${i.name} | ${i.cond} | $${i.sale} (was $${i.reg}, save $${i.savings}/${i.pct}% off)${i.specs.length ? " | " + i.specs.join(", ") : ""} | SKU:${i.sku}`
  ).join("\n");

  try {
    if (isDemoMode) throw new Error("Use local advisor for demo mode.");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "You are a sharp Best Buy sales associate helping floor employees find the best open box deals for customers. Give punchy practical advice. Top 2-3 picks max. Mention specs when relevant. Use dollar amounts. Include one quick sell line per pick. Under 180 words. Sound like a knowledgeable colleague, not a bot.",
        messages: [{ role: "user", content: `Query: "${query || "What are the best open box deals to push right now?"}"\n\nInventory:\n${inv || "No items."}\n\nWhat do I recommend?` }]
      })
    });
    if (!r.ok) throw new Error("External advisor unavailable.");
    const data = await r.json();
    res.innerHTML = (data.content?.[0]?.text || "No response.").replace(/\n/g, "<br>");
    res.classList.add("open");
  } catch {
    res.innerHTML = createLocalAdvisorResponse(query, items).replace(/\n/g, "<br>");
    res.classList.add("open");
  }
  btn.disabled = false; load.classList.remove("open");
});

function createLocalAdvisorResponse(query, items) {
  if (!items.length) return "No matching open box inventory is visible. Clear search or switch departments, then run the advisor again.";
  const q = query.toLowerCase();
  let candidates = items.slice();
  if (/under|budget|\$/.test(q)) {
    const budget = parseFloat((q.match(/\$?\s*(\d{3,5})/) || [])[1]);
    if (budget) candidates = candidates.filter(i => i.sale <= budget);
  }
  if (/apple|iphone|ipad|macbook/.test(q)) candidates = candidates.filter(i => i.brand === "Apple");
  if (/tv|television|oled|qled/.test(q)) candidates = candidates.filter(i => i.category === "tvs");
  if (/laptop|college|student|windows|macbook/.test(q)) candidates = candidates.filter(i => i.category === "laptops");
  if (/excellent|like new|brand new/.test(q)) candidates = candidates.filter(i => i.cond === "excellent");
  if (/biggest|savings|save|push|best/.test(q)) candidates.sort((a, b) => b.savings - a.savings || b.rating - a.rating);
  else candidates.sort((a, b) => b.pct - a.pct || b.rating - a.rating);
  if (!candidates.length) candidates = items.slice().sort((a, b) => b.savings - a.savings);

  const picks = candidates.slice(0, 3);
  const lines = picks.map((i, idx) => {
    const spec = i.specs.length ? ` ${i.specs.slice(0, 2).join(", ")}.` : "";
    const condition = i.cond === "excellent" ? "Excellent condition" : i.cond === "certified" ? "Certified open box" : `${i.cond[0].toUpperCase()}${i.cond.slice(1)} condition`;
    return `${idx + 1}. ${i.name} — $${i.sale.toFixed(2)}, save $${i.savings.toFixed(0)} (${i.pct}% off). ${condition}.${spec} Sell line: "This is the strongest value on the shelf without stepping down into a lower class product." SKU ${i.sku}.`;
  });
  const attach = quoteProductKeys.length
    ? `Basket note: with ${getMembershipName()}, this quote can also show the 60-day return window and card financing/store-credit math.`
    : `Attach note: lead with ${getMembershipName()} for the 60-day return window, then show card financing or rewards if the customer is deciding on monthly cost.`;
  return [`Demo advisor recommendation:`, ...lines, attach].join("\n\n");
}

// ─────────────────────────────────────────────
//  MODALS
// ─────────────────────────────────────────────
document.getElementById("lpn-close").addEventListener("click", () => document.getElementById("lpn-modal").classList.remove("open"));
document.getElementById("lpn-modal").addEventListener("click", e => { if (e.target === document.getElementById("lpn-modal")) document.getElementById("lpn-modal").classList.remove("open"); });

document.getElementById("favorite-modal-close").addEventListener("click", () => document.getElementById("favorite-modal").classList.remove("open"));
document.getElementById("favorite-modal-panel").addEventListener("click", () => {
  document.getElementById("favorite-modal").classList.remove("open");
  document.getElementById("favorites-panel").scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
});
document.getElementById("favorite-modal").addEventListener("click", e => { if (e.target === document.getElementById("favorite-modal")) document.getElementById("favorite-modal").classList.remove("open"); });

// ─────────────────────────────────────────────
//  SMALL UI HELPERS
// ─────────────────────────────────────────────
function showGateError(msg) {
  const el = document.getElementById("gate-err");
  el.textContent = msg; el.style.display = "block";
}
let toastTimer = null;
function showToastMessage(msg, action) {
  const t = document.getElementById("toast");
  if (toastTimer) clearTimeout(toastTimer);
  t.classList.remove("show");
  t.innerHTML = `<span>${escapeHtmlText(msg)}</span>${action ? `<button class="toast-action" type="button">${escapeHtmlText(action.label)}</button>` : ""}`;
  if (action) {
    t.querySelector(".toast-action").addEventListener("click", () => {
      t.classList.remove("show");
      action.onClick();
    });
  }
  requestAnimationFrame(() => t.classList.add("show"));
  toastTimer = setTimeout(() => t.classList.remove("show"), action ? 4200 : 2300);
}

function showFavoriteSavedMessage() {
  showToastMessage("Saved to favorites", {
    label: "View",
    onClick: openFavoritesModal,
  });
}

function openFavoritesModal() {
  const modal = document.getElementById("favorite-modal");
  const list = document.getElementById("favorites-modal-list");
  const favoriteItems = favoriteProductKeys.map(findProductByKey).filter(Boolean);
  list.innerHTML = favoriteItems.length
    ? document.getElementById("favorite-list").innerHTML
    : `<div class="favorite-empty">Tap hearts on products to keep them here</div>`;
  list.querySelectorAll("[data-remove-favorite]").forEach(btn => {
    btn.addEventListener("click", () => {
      favoriteProductKeys = favoriteProductKeys.filter(id => id !== btn.dataset.removeFavorite);
      saveFavoriteProductKeys();
      renderSalesWorkbench();
      renderProductGrid();
      openFavoritesModal();
    });
  });
  modal.classList.add("open");
}

// Registers the service worker only when the site is served over HTTP/HTTPS.
function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Handles the browser's install prompt and the iOS Add to Home Screen helper.
function setupAppInstallPrompt() {
  const prompt = document.getElementById("install-prompt");
  const action = document.getElementById("install-action");
  const copy = document.getElementById("install-copy");
  const close = document.getElementById("install-close");
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const dismissed = localStorage.getItem("bb_install_dismissed") === "1";

  const showPrompt = () => {
    if (isStandalone || dismissed) return;
    prompt.classList.add("show");
  };

  close.addEventListener("click", () => {
    localStorage.setItem("bb_install_dismissed", "1");
    prompt.classList.remove("show");
  });

  action.addEventListener("click", async () => {
    if (savedInstallPromptEvent) {
      savedInstallPromptEvent.prompt();
      await savedInstallPromptEvent.userChoice.catch(() => {});
      savedInstallPromptEvent = null;
      prompt.classList.remove("show");
      return;
    }
    showToastMessage(isIos ? "Tap Share, then Add to Home Screen" : "Use browser menu to install Open Box");
  });

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    savedInstallPromptEvent = e;
    copy.textContent = "Install the app for full-screen access from your home screen.";
    action.textContent = "Install";
    setTimeout(showPrompt, 900);
  });

  if (isIos) {
    copy.textContent = "Tap Share, then Add to Home Screen for the full-screen app.";
    action.textContent = "How";
    setTimeout(showPrompt, 1200);
  }
}
