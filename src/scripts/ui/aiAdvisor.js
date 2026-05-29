// ─────────────────────────────────────────────
//  AI DEAL ADVISOR OVERLAY
//  Uses the live Anthropic API in real mode and a local keyword fallback
//  in demo mode or when the API is unavailable.
//  When Best Buy ships their own AI endpoint, swap fetchLiveAdvisorResponse
//  in aiAdvisorService.js — this file only wires the UI.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { getVisibleProducts } from "../utils/productUtils.js";
import { fetchLiveAdvisorResponse, buildLocalAdvisorResponse } from "../services/aiAdvisorService.js";

export function setupAiAdvisor() {
  const overlay = document.getElementById("ai-ov");

  document.getElementById("ai-open-btn").addEventListener("click", () => overlay.classList.add("open"));
  document.getElementById("ai-btn-ctrl").addEventListener("click", () => overlay.classList.add("open"));
  document.getElementById("ai-close").addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("open"); });

  // Quick-chip buttons pre-fill the textarea with common associate queries.
  document.querySelectorAll(".ai-qchip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.getElementById("ai-ta").value = chip.dataset.q;
    });
  });

  document.getElementById("ai-go").addEventListener("click", () => runAdvisorQuery());
}

async function runAdvisorQuery() {
  const query = document.getElementById("ai-ta").value.trim();
  const btn = document.getElementById("ai-go");
  const load = document.getElementById("ai-loading");
  const res = document.getElementById("ai-result");

  btn.disabled = true;
  load.classList.add("open");
  res.classList.remove("open");

  // Send up to 10 visible products as context for the recommendation.
  const items = getVisibleProducts().slice(0, 10);

  try {
    if (state.isDemoMode) throw new Error("Use local advisor for demo mode.");
    const text = await fetchLiveAdvisorResponse(query, items);
    res.innerHTML = text.replace(/\n/g, "<br>");
  } catch {
    res.innerHTML = buildLocalAdvisorResponse(query, items).replace(/\n/g, "<br>");
  }

  res.classList.add("open");
  btn.disabled = false;
  load.classList.remove("open");
}
