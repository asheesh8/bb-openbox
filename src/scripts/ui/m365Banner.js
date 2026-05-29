// ─────────────────────────────────────────────
//  MICROSOFT 365 BANNER
//  Full-width contextual strip rendered between the results header
//  and the product grid. Appears only on Laptops and Computers tabs.
//
//  Contains:
//    • Microsoft logo (4-color grid)
//    • Benefit pills (Office, OneDrive, Defender, multi-device)
//    • Personal / Family plan attach buttons that toggle into the quote
//
//  All M365 plan data lives in utils/m365Utils.js — nothing is hardcoded here.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { M365_PLANS, M365_DEPTS, M365_BENEFITS } from "../utils/m365Utils.js";
import { renderSalesWorkbench } from "./salesWorkbench.js";

export function renderM365Banner() {
  const banner = document.getElementById("m365-banner");
  if (!banner) return;

  const show = M365_DEPTS.includes(state.selectedDeptId);
  banner.hidden = !show;
  if (!show) { banner.innerHTML = ""; return; }

  const deptLabel = state.selectedDeptId === "laptops" ? "laptop" : "computer";
  const activePlan = state.m365Plan;

  banner.innerHTML = `
    <div class="m365-banner-in">

      ${buildLogoAndCopy(deptLabel)}
      ${buildBenefitPills()}
      ${buildAttachButtons(activePlan)}

    </div>
  `;

  // Plan toggle: selecting the active plan again clears it (acts as a deselect).
  banner.querySelectorAll("[data-m365]").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.m365;
      state.m365Plan = (val === "remove" || state.m365Plan === val) ? null : val;
      renderSalesWorkbench(); // refreshes quote totals + banner active state
    });
  });
}

// ─── HTML builders ───────────────────────────────────────────

function buildLogoAndCopy(deptLabel) {
  return `
    <div class="m365-hero">
      <div class="m365-icon" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
      <div>
        <div class="m365-title">Add Microsoft 365 with this ${deptLabel}</div>
        <div class="m365-copy">Word, Excel, PowerPoint, Outlook, 1 TB OneDrive — ready on day one.</div>
      </div>
    </div>`;
}

function buildBenefitPills() {
  const pills = M365_BENEFITS.map(
    b => `<div class="m365-pill"><span class="m365-pill-icon">${b.icon}</span> ${b.text}</div>`
  ).join("");
  return `<div class="m365-pills">${pills}</div>`;
}

function buildAttachButtons(activePlan) {
  const buttons = Object.values(M365_PLANS).map(plan => `
    <button class="m365-attach-btn${activePlan === plan.key ? " on" : ""}" data-m365="${plan.key}" type="button">
      <span class="m365-attach-name">${plan.name}</span>
      <span class="m365-attach-price">$${plan.price.toFixed(2)}/${plan.per}</span>
      <span class="m365-attach-desc">${plan.desc}</span>
    </button>`).join("");

  const removeBtn = activePlan
    ? `<button class="m365-remove-btn" data-m365="remove" type="button">Remove</button>`
    : "";

  return `<div class="m365-attach-row">${buttons}${removeBtn}</div>`;
}
