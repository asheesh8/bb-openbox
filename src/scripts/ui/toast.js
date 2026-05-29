// ─────────────────────────────────────────────
//  TOAST NOTIFICATIONS
//  Optional `action` adds a tappable button that dismisses the toast
//  and fires a callback — used for "Saved to favorites → View".
// ─────────────────────────────────────────────
import { escapeHtml } from "../utils/htmlUtils.js";

let toastTimer = null;

export function showToast(msg, action) {
  const t = document.getElementById("toast");
  if (toastTimer) clearTimeout(toastTimer);
  t.classList.remove("show");

  t.innerHTML = `<span>${escapeHtml(msg)}</span>${
    action ? `<button class="toast-action" type="button">${escapeHtml(action.label)}</button>` : ""
  }`;

  if (action) {
    t.querySelector(".toast-action").addEventListener("click", () => {
      t.classList.remove("show");
      action.onClick();
    });
  }

  requestAnimationFrame(() => t.classList.add("show"));
  toastTimer = setTimeout(() => t.classList.remove("show"), action ? 4200 : 2300);
}
