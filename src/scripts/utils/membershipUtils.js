// ─────────────────────────────────────────────
//  MEMBERSHIP UTILITIES
//  Derives cost, name, and benefit copy from the currently selected plan.
//  Add new plan types here when Best Buy introduces them.
// ─────────────────────────────────────────────
import state from "../state/appState.js";

export function getMembershipCost() {
  return state.membershipPlan === "total" ? 199.99 : 29.99;
}

export function getMembershipName() {
  return state.membershipPlan === "total" ? "My Best Buy Total" : "My Best Buy Plus";
}

export function getMembershipBenefits() {
  if (state.membershipPlan === "total") {
    return [
      "All My Best Buy Plus benefits included",
      "Up to 2 yrs product protection + AppleCare+",
      "Protection plans renewable after 2 yrs (TVs, laptops)",
      "24/7 tech support — in-store & remote",
      "VIP member support",
      "20% off repairs",
    ];
  }
  return [
    "1% back in rewards on Best Buy purchases",
    "Exclusive member prices on thousands of items",
    "Extended 60-day return & exchange window",
    "Exclusive access to sales, events & products",
    "Free 2-day shipping on eligible items",
  ];
}
