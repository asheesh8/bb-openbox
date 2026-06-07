// ─────────────────────────────────────────────
//  APP STATE  (singleton)
//  Single source of truth for all mutable app state.
//  Import this object in any module that needs to read or write state.
//  Never import state at the top level and then reassign the binding —
//  always mutate the object's properties so all importers see changes.
// ─────────────────────────────────────────────
import { DEPTS } from "../config/productDepartments.js";

function loadFavoriteKeys() {
  try {
    const parsed = JSON.parse(localStorage.getItem("bb_favorites") || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

const state = {
  // Auth + mode
  apiKey: localStorage.getItem("bb_key") || "",
  isDemoMode: false,

  // Inventory
  allProducts: [],
  lastFetchedAt: null,

  // Navigation
  selectedDeptId: DEPTS[0].id,
  selectedStoreId: localStorage.getItem("bb_store") || "360",

  // Filtering / sorting
  selectedFilters: {},
  searchText: "",
  sortMode: "savings",

  // UI
  expandedProductKey: null,
  detailProductKey: null,
  signedInRole: "",

  // Sales workbench selections
  comparisonKeys: [],
  quoteKeys: [],
  favoriteKeys: loadFavoriteKeys(),

  // Member attach
  membershipPlan: "plus",
  selectedMember: null,

  // Microsoft 365 attach — null means not added, "personal" or "family" when toggled on
  m365Plan: null,

  // PWA
  installPromptEvent: null,

  // Demo helpers
  demoCardOnFile: false,
};

export default state;
