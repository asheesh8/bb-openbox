// ─────────────────────────────────────────────
//  STORE PANEL
//  Store choice drives tax calculations, live inventory scope,
//  and the store label shown in the toolbar.
//  Adding a new store: edit config/storeLocations.js only.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { STORES } from "../config/storeLocations.js";

export function getSelectedStore() {
  return STORES.find(s => s.id === state.selectedStoreId) || STORES[0];
}

export function renderStoreDropdown() {
  const select = document.getElementById("store-select");
  select.innerHTML = STORES.map(
    s => `<option value="${s.id}"${s.id === state.selectedStoreId ? " selected" : ""}>${s.label}</option>`
  ).join("");
}

export function renderStoreSummary() {
  const store = getSelectedStore();
  const role = state.signedInRole ? ` · ${state.signedInRole}` : "";
  document.getElementById("tb-store").textContent = `Store ${store.bbStoreId}${role}`;
  document.getElementById("store-kicker").textContent = `${(store.tax * 100).toFixed(2)}% tax`;
  document.getElementById("store-facts").innerHTML = `
    <div class="store-fact"><span>Location</span><strong>${store.city}, ${store.state}</strong></div>
    <div class="store-fact"><span>Store ID</span><strong>${store.bbStoreId}</strong></div>
    <div class="store-fact"><span>Sales tax</span><strong>${(store.tax * 100).toFixed(2)}%</strong></div>
    <div class="store-fact"><span>Fulfillment</span><strong>${store.pickup}</strong></div>
  `;
}
