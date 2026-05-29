// ─────────────────────────────────────────────
//  MEMBERSHIP UTILITIES
//  Derives cost, name, and benefit copy from the currently selected plan.
//  Add new plan types here when Best Buy introduces them.
// ─────────────────────────────────────────────
import state from "../state/appState.js";

export function getMembershipCost() {
  return state.membershipPlan === "total" ? 179.99 : 29.99;
}

export function getMembershipName() {
  return state.membershipPlan === "total" ? "My Best Buy Total" : "My Best Buy Plus";
}

export function getMembershipBenefits() {
  if (state.membershipPlan === "total") {
    return [
      "24/7 tech support for covered products",
      "Protection plans included on eligible purchases",
      "VIP member pricing and exclusive deals",
      "Extended 60-day return window",
    ];
  }
  return [
    "Member-only pricing and exclusive deals",
    "Extended 60-day return window",
    "Free 2-day shipping on eligible items",
    "Good attach for open box savings shoppers",
  ];
}
