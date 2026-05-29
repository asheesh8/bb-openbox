// ─────────────────────────────────────────────
//  PRODUCT UTILITIES
//  Pure functions for product keying, lookup, filtering, and sorting.
//  Nothing in here touches the DOM — rendering is handled by ui/productGrid.js.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";

// Stable identity key for a specific open box offer (SKU + condition).
export function getProductKey(item) {
  return `${item.sku}-${item.cond}`;
}

export function findProductByKey(id) {
  return state.allProducts.find(i => getProductKey(i) === id);
}

// Resets filter selections when the associate switches departments.
export function resetFiltersForDept() {
  state.selectedFilters = {};
  const dept = DEPTS.find(d => d.id === state.selectedDeptId);
  if (dept) dept.filters.forEach(f => { state.selectedFilters[f.id] = "All"; });
  state.selectedFilters.condition = "All";
  state.sortMode = "savings";
}

// Applies the active department filters, condition filter, search text,
// and sort order to produce the exact list shown in the product grid.
export function getVisibleProducts() {
  const dept = DEPTS.find(d => d.id === state.selectedDeptId);
  let items = state.allProducts.filter(i => i.category === state.selectedDeptId);

  if (dept) {
    dept.filters.forEach(f => {
      const val = state.selectedFilters[f.id];
      if (!val || val === "All") return;

      if (f.id === "brand") {
        items = items.filter(i => i.brand === val);
      } else if (f.id === "ram" || f.id === "storage") {
        items = items.filter(i => i.specs.some(s => s.toLowerCase().includes(val.toLowerCase())));
      } else if (f.id === "size") {
        // TV size ranges — parsed from the first spec containing a double-quote.
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
        // Fuzzy match: strip plural endings to handle "OLED" matching "OLEDs" etc.
        const needle = val.toLowerCase().replace(/s$/, "");
        items = items.filter(
          i =>
            i.specs.some(s => s.toLowerCase().replace(/s$/, "").includes(needle)) ||
            i.name.toLowerCase().replace(/s\b/g, "").includes(needle)
        );
      }
    });
  }

  const condition = state.selectedFilters.condition;
  if (condition && condition !== "All") {
    items = items.filter(i => i.cond.toLowerCase() === condition.toLowerCase());
  }

  if (state.searchText) {
    const s = state.searchText.toLowerCase();
    items = items.filter(
      i =>
        i.name.toLowerCase().includes(s) ||
        String(i.sku).includes(s) ||
        i.brand.toLowerCase().includes(s) ||
        i.specs.some(spec => spec.toLowerCase().includes(s))
    );
  }

  items.sort((a, b) => {
    if (state.sortMode === "savings") return b.savings - a.savings;
    if (state.sortMode === "pct") return b.pct - a.pct;
    if (state.sortMode === "price_asc") return a.sale - b.sale;
    if (state.sortMode === "price_desc") return b.sale - a.sale;
    if (state.sortMode === "rating") return b.rating - a.rating;
    return 0;
  });

  return items;
}
