// ─────────────────────────────────────────────
//  HTML UTILITIES
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";

// XSS guard — escape user-controlled strings before DOM insertion.
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
  );
}

// Returns the active filter chips shown above the product grid.
export function getActiveFilterChips() {
  const chips = [];
  const dept = DEPTS.find(d => d.id === state.selectedDeptId);

  if (dept) {
    dept.filters.forEach(f => {
      const value = state.selectedFilters[f.id];
      if (value && value !== "All") chips.push({ label: f.label, value });
    });
  }
  if (state.selectedFilters.condition && state.selectedFilters.condition !== "All") {
    chips.push({ label: "Condition", value: state.selectedFilters.condition });
  }
  if (state.searchText.trim()) {
    chips.push({ label: "Search", value: state.searchText.trim() });
  }

  return chips;
}
