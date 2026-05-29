// ─────────────────────────────────────────────
//  DEPARTMENT NAVIGATION TABS
//  Switching departments resets filters and re-renders the grid.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";
import { resetFiltersForDept } from "../utils/productUtils.js";
import { renderFilterBar } from "./filterBar.js";
import { renderProductGrid } from "./productGrid.js";

export function renderDepartmentTabs() {
  const el = document.getElementById("dept-tabs");
  el.innerHTML = DEPTS.map(
    d => `
    <button class="dept-tab${d.id === state.selectedDeptId ? " active" : ""}" data-dept="${d.id}">
      <span class="dt-icon">${d.icon}</span>
      <span class="dt-label">${d.label}</span>
    </button>`
  ).join("");

  el.querySelectorAll(".dept-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.selectedDeptId = btn.dataset.dept;
      state.expandedProductKey = null;
      el.querySelectorAll(".dept-tab").forEach(b =>
        b.classList.toggle("active", b.dataset.dept === state.selectedDeptId)
      );
      resetFiltersForDept();
      renderFilterBar();
      renderProductGrid();
    });
  });
}
