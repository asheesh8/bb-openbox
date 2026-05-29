// ─────────────────────────────────────────────
//  FILTER BAR
//  Rebuilds filter pills and the sort dropdown whenever the department changes.
//  The sort select is always rendered regardless of which department is active.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { DEPTS } from "../config/productDepartments.js";
import { renderProductGrid } from "./productGrid.js";

export function renderFilterBar() {
  const dept = DEPTS.find(d => d.id === state.selectedDeptId);
  const el = document.getElementById("dept-filters");
  if (!dept) { el.innerHTML = ""; return; }

  let html = "";

  dept.filters.forEach((f, i) => {
    if (i > 0) html += `<div class="filter-sep"></div>`;
    html += `<div class="filter-group">`;
    html += `<span class="filter-group-label">${f.label}</span>`;
    f.opts.forEach(opt => {
      const active = state.selectedFilters[f.id] === opt;
      html += `<button class="pill-btn${active ? " on" : ""}" data-filter="${f.id}" data-val="${opt}">${opt}</button>`;
    });
    html += `</div>`;
  });

  html += `<div class="filter-sep"></div>`;
  html += `<div class="filter-group"><span class="filter-group-label">Condition</span>`;
  ["All", "Excellent", "Certified", "Good", "Satisfactory"].forEach(opt => {
    const active = state.selectedFilters.condition === opt;
    html += `<button class="pill-btn${active ? " on" : ""}" data-filter="condition" data-val="${opt}">${opt}</button>`;
  });
  html += `</div>`;

  html += `<div class="filter-sep"></div>
  <select class="sort-select" id="sort-select">
    <option value="savings"${state.sortMode === "savings" ? " selected" : ""}>Biggest sale</option>
    <option value="pct"${state.sortMode === "pct" ? " selected" : ""}>% off</option>
    <option value="price_asc"${state.sortMode === "price_asc" ? " selected" : ""}>Price increasing</option>
    <option value="price_desc"${state.sortMode === "price_desc" ? " selected" : ""}>Price decreasing</option>
    <option value="rating"${state.sortMode === "rating" ? " selected" : ""}>By rating</option>
  </select>`;

  el.innerHTML = html;

  el.querySelectorAll(".pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const { filter: f, val: v } = btn.dataset;
      state.selectedFilters[f] = v;
      el.querySelectorAll(`.pill-btn[data-filter="${f}"]`)
        .forEach(b => b.classList.toggle("on", b.dataset.val === v));
      renderProductGrid();
    });
  });

  const sortSelect = el.querySelector("#sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", e => {
      state.sortMode = e.target.value;
      renderProductGrid();
    });
  }
}
