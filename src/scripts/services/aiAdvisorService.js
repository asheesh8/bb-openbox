// ─────────────────────────────────────────────
//  AI ADVISOR SERVICE
//  Two strategies: live Anthropic API call for real mode,
//  keyword-based local fallback for demo mode or API failures.
//  When Best Buy's own AI endpoint is available, swap fetchLiveAdvisorResponse
//  for a call to their API instead — the interface stays the same.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { getMembershipName } from "../utils/membershipUtils.js";

// Calls the Anthropic Messages API and returns the advisor text.
export async function fetchLiveAdvisorResponse(query, items) {
  const inv = items
    .map(
      i =>
        `- ${i.name} | ${i.cond} | $${i.sale} (was $${i.reg}, save $${i.savings}/${i.pct}% off)${i.specs.length ? " | " + i.specs.join(", ") : ""} | SKU:${i.sku}`
    )
    .join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system:
        "You are a sharp Best Buy sales associate helping floor employees find the best open box deals for customers. Give punchy practical advice. Top 2-3 picks max. Mention specs when relevant. Use dollar amounts. Include one quick sell line per pick. Under 180 words. Sound like a knowledgeable colleague, not a bot.",
      messages: [
        {
          role: "user",
          content: `Query: "${query || "What are the best open box deals to push right now?"}"\n\nInventory:\n${inv || "No items."}\n\nWhat do I recommend?`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("External advisor unavailable.");
  const data = await response.json();
  return data.content?.[0]?.text || "No response.";
}

// Keyword-based fallback — no network needed. Covers common associate queries.
export function buildLocalAdvisorResponse(query, items) {
  if (!items.length) {
    return "No matching open box inventory is visible. Clear search or switch departments, then run the advisor again.";
  }

  const q = query.toLowerCase();
  let candidates = items.slice();

  // Narrow by price ceiling if associate mentions a dollar amount.
  if (/under|budget|\$/.test(q)) {
    const budget = parseFloat((q.match(/\$?\s*(\d{3,5})/) || [])[1]);
    if (budget) candidates = candidates.filter(i => i.sale <= budget);
  }

  // Narrow by brand or category keywords.
  if (/apple|iphone|ipad|macbook/.test(q)) candidates = candidates.filter(i => i.brand === "Apple");
  if (/tv|television|oled|qled/.test(q)) candidates = candidates.filter(i => i.category === "tvs");
  if (/laptop|college|student|windows|macbook/.test(q)) candidates = candidates.filter(i => i.category === "laptops");
  if (/excellent|like new|brand new/.test(q)) candidates = candidates.filter(i => i.cond === "excellent");

  // Sort by what the associate seems to care about most.
  if (/biggest|savings|save|push|best/.test(q)) {
    candidates.sort((a, b) => b.savings - a.savings || b.rating - a.rating);
  } else {
    candidates.sort((a, b) => b.pct - a.pct || b.rating - a.rating);
  }

  // Fall back to highest savings overall if no candidates matched keywords.
  if (!candidates.length) candidates = items.slice().sort((a, b) => b.savings - a.savings);

  const picks = candidates.slice(0, 3);
  const lines = picks.map((item, idx) => {
    const spec = item.specs.length ? ` ${item.specs.slice(0, 2).join(", ")}.` : "";
    const condLabel =
      item.cond === "excellent"
        ? "Excellent condition"
        : item.cond === "certified"
        ? "Certified open box"
        : `${item.cond[0].toUpperCase()}${item.cond.slice(1)} condition`;
    return `${idx + 1}. ${item.name} — $${item.sale.toFixed(2)}, save $${item.savings.toFixed(0)} (${item.pct}% off). ${condLabel}.${spec} Sell line: "This is the strongest value on the shelf without stepping down into a lower class product." SKU ${item.sku}.`;
  });

  // Remind associate to attach membership if basket is empty.
  const attach = state.quoteKeys.length
    ? `Basket note: with ${getMembershipName()}, this quote can also show the 60-day return window and card financing/store-credit math.`
    : `Attach note: lead with ${getMembershipName()} for the 60-day return window, then show card financing or rewards if the customer is deciding on monthly cost.`;

  return ["Demo advisor recommendation:", ...lines, attach].join("\n\n");
}
