// ─────────────────────────────────────────────
//  QUOTE / FAVORITES TEXT BUILDERS
//  Produces the plain-text strings copied to the associate's clipboard.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { findProductByKey } from "./productUtils.js";
import { getMembershipCost, getMembershipName } from "./membershipUtils.js";
import { getSelectedStore } from "../ui/storePanel.js";

// Builds the customer recap text for the quote clipboard button.
export function buildQuoteText() {
  const items = state.quoteKeys.map(findProductByKey).filter(Boolean);
  if (!items.length) return "Open Box Finder quote: no products added yet.";

  const store = getSelectedStore();
  const subtotal = items.reduce((sum, i) => sum + i.sale, 0);
  const savings = items.reduce((sum, i) => sum + i.savings, 0);
  const taxable = subtotal + getMembershipCost();
  const tax = taxable * store.tax;

  return [
    `Open Box Finder quote${state.selectedMember ? ` for ${state.selectedMember.name}` : ""} · Store ${store.bbStoreId} ${store.city}, ${store.state}:`,
    ...items.map(i => `${i.name} - $${i.sale.toFixed(2)} open box (${i.cond}), save $${i.savings.toFixed(2)}. SKU ${i.sku}`),
    `${getMembershipName()}: $${getMembershipCost().toFixed(2)}/yr`,
    `Estimated tax (${(store.tax * 100).toFixed(2)}%): $${tax.toFixed(2)}`,
    `Estimated basket: $${(taxable + tax).toFixed(2)}`,
    `Open box savings: $${savings.toFixed(2)}`,
  ].join("\n");
}

// Builds the shareable favorites list text.
export function buildFavoritesText() {
  const items = state.favoriteKeys.map(findProductByKey).filter(Boolean);
  if (!items.length) return "Open Box Finder favorites: no products saved yet.";

  const store = getSelectedStore();
  return [
    `Open Box Finder favorites · Store ${store.bbStoreId} ${store.city}, ${store.state}:`,
    ...items.map(i => `${i.name} - $${i.sale.toFixed(2)} open box (${i.cond}), save $${i.savings.toFixed(2)}. SKU ${i.sku}`),
  ].join("\n");
}
