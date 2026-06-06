// ─────────────────────────────────────────────
//  MICROSOFT 365 UTILITIES
//  All M365 plan definitions and cost helpers live here.
//  To add a new plan tier or update pricing, edit PLANS only —
//  nothing else in the codebase needs to change.
// ─────────────────────────────────────────────
import state from "../state/appState.js";

// Plan definitions — label shown in UI, annual price, billing period, short descriptor.
export const M365_PLANS = {
  personal: {
    key:   "personal",
    label: "Microsoft 365 Personal",
    name:  "Personal",
    price: 99.99,
    per:   "yr",
    desc:  "1 person · 1 TB OneDrive",
  },
  family: {
    key:   "family",
    label: "Microsoft 365 Family",
    name:  "Family",
    price: 129.99,
    per:   "yr",
    desc:  "Up to 6 people · 1 TB each",
  },
};

// Departments where M365 is a relevant attach — drives banner visibility.
export const M365_DEPTS = ["laptops"];

// Key selling points shown as pills in the banner.
export const M365_BENEFITS = [
  { icon: "✓",  text: "Office apps they already know" },
  { icon: "☁",  text: "1 TB cloud backup" },
  { icon: "🛡️", text: "Microsoft Defender included" },
  { icon: "🔗", text: "Up to 6 devices per family" },
];

// Returns the cost of the currently selected M365 plan, or 0 if none selected.
export function getM365Cost() {
  return state.m365Plan ? M365_PLANS[state.m365Plan].price : 0;
}

// Returns the full label of the active plan (e.g. "Microsoft 365 Family"), or null.
export function getM365Label() {
  return state.m365Plan ? M365_PLANS[state.m365Plan].label : null;
}
