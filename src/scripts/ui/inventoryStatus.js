// ─────────────────────────────────────────────
//  INVENTORY STATUS INDICATOR
//  Shows "Live · Updated HH:MM" or "Sample data" in the toolbar.
// ─────────────────────────────────────────────
import state from "../state/appState.js";

export function renderInventoryStatus() {
  const el = document.getElementById("live-indicator");
  if (state.isDemoMode) {
    el.innerHTML = `<span class="live-dot demo-dot">Sample data</span>`;
    return;
  }
  const t = state.lastFetchedAt
    ? state.lastFetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "–";
  el.innerHTML = `<span class="live-dot">Live · Updated ${t}</span>`;
}
