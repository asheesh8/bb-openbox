// Guided walkthrough overlay — launched when the associate clicks the BB logo on the gate screen.

const SCENARIOS = [
  {
    tag: "Bringing It Up",
    icon: "💬",
    setup: "Customer is browsing TVs, hasn't committed yet",
    script: `"Hey real quick — you mind if I pull something up? There's a tool I use that shows all our open box stock with exact prices. Sometimes it's the same exact TV for like $200 less." Then just hand them your phone and let the savings do the talking.`,
  },
  {
    tag: "Pitching Total",
    icon: "🛡️",
    setup: "Customer found an open box item they like",
    script: `"So you're already saving [X] off retail — for $199 a year, Total covers this plus up to 4 other devices in your house. Drops, spills, tech support, 20% off repairs. On something like this it pretty much pays for itself the first time something goes wrong."`,
  },
  {
    tag: "M365 on a Laptop",
    icon: "💻",
    setup: "Customer is buying an open box laptop or computer",
    script: `"Are you gonna be doing any Word docs or spreadsheets on this? We can add Microsoft 365 today — it's Word, Excel, PowerPoint, and a full terabyte of OneDrive. Normally $100 a year, and it works on up to 6 devices so your whole family can use it."`,
  },
  {
    tag: "1% Back with Total",
    icon: "💰",
    setup: "Customer is on the fence about Total",
    script: `"One thing people don't always catch — with Total you get 1% back on basically everything you buy here. So on a $700 TV you're already getting $7 back, and it stacks. If you shop here even a few times a year it adds up pretty fast on top of everything else Total does."`,
  },
  {
    tag: "Condition Tiers",
    icon: "📦",
    setup: "Customer asks what 'Excellent' or 'Certified' means",
    script: `"Certified is basically brand new — somebody bought it and returned it unopened or barely used, Best Buy inspected it and it's fully functional. Excellent means it works perfectly but might have a tiny scratch you'd have to look for. Scratch & Dent is where the big discounts are — cosmetic only, works the same."`,
  },
];

let scenarioIdx = 0;

const STEPS = [
  {
    target: null,
    title: "Welcome to Open Box Finder",
    label: null,
    body: "Quick walkthrough — how to find a deal and hand a quote to your customer.",
    interactive: false,
  },
  {
    target: "#dept-tabs",
    title: "Pick a Department",
    label: "1 of 8",
    body: "Tap a tab to scope the grid to what your customer is browsing.",
    interactive: true,
  },
  {
    target: "#dept-filters",
    title: "Filter the Grid",
    label: "2 of 8",
    body: "Narrow by <strong>Condition</strong>, brand, or price. Sort by savings to lead with the best pitch.",
    interactive: true,
  },
  {
    target: ".product-grid",
    title: "Deal Cards",
    label: "3 of 8",
    body: "Tap any card to expand it and see the pitch coaching for that condition tier.",
    interactive: true,
  },
  {
    target: ".member-lookup",
    title: "Member Lookup",
    label: "5 of 8",
    body: "Enter a phone or email → tap <strong>Lookup</strong> to see their tier and rewards.",
    interactive: true,
    tryHint: "Try it — type anything and tap Lookup",
  },
  {
    target: ".attach-grid",
    title: "Membership Attach",
    label: "6 of 8",
    body: "Offer an upgrade. <strong>Total ($199.99/yr)</strong> is easy to justify on any open box purchase.",
    interactive: true,
    tryHint: "Tap Plus or Total to see benefits update",
  },
  {
    target: "#quote-panel",
    title: "Quote Basket",
    label: "7 of 8",
    body: "Add items with <strong>+ Basket</strong>. Tax, membership, and savings all calculate live.",
    interactive: false,
  },
  {
    target: "#copy-quote-btn",
    title: "Copy the Quote",
    label: "8 of 8",
    body: "Copies a full breakdown to your clipboard — paste it in a text to the customer.",
    interactive: true,
    tryHint: "Tap Copy Quote to try it",
  },
  {
    target: null,
    title: "You're Ready",
    label: "Done",
    body: "No login needed — the tool works on any device. Go run the sale.",
    interactive: false,
  },
];

const SIDEBAR_W = 244;
const DESKTOP_BP = 680;

let currentStep = 0;
let tourActive  = false;
let posTimer    = null;
let scrollRaf   = null;

// ── Public entry point ─────────────────────────────────────────────────────

export function startGuidedTour() {
  if (tourActive) return;
  tourActive   = true;
  currentStep  = 0;
  injectStyles();
  buildDom();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  renderStep(0);
}

// ── DOM ────────────────────────────────────────────────────────────────────

function buildDom() {
  const root = document.createElement("div");
  root.id = "tour-root";
  root.innerHTML = `<div id="tour-spotlight"></div>`;
  document.body.appendChild(root);

  const tip = document.createElement("div");
  tip.id = "tour-tooltip";
  tip.setAttribute("role", "dialog");
  tip.setAttribute("aria-modal", "true");
  tip.setAttribute("aria-labelledby", "tour-ttl");
  tip.innerHTML = `
    <div id="tour-bar"><div id="tour-fill"></div></div>
    <div id="tour-inner">
      <div id="tour-top">
        <span id="tour-label"></span>
        <button id="tour-x" type="button" aria-label="Close walkthrough">✕</button>
      </div>
      <div id="tour-ttl"></div>
      <div id="tour-body"></div>
      <div id="tour-hint" hidden></div>
      <div id="tour-elearn" hidden>
        <div id="elearn-header">
          <span id="elearn-heading">Real Talk</span>
          <div id="elearn-nav">
            <button id="elearn-prev" type="button" aria-label="Previous scenario">‹</button>
            <span id="elearn-counter"></span>
            <button id="elearn-next" type="button" aria-label="Next scenario">›</button>
          </div>
        </div>
        <div id="elearn-card">
          <div id="elearn-setup"></div>
          <div id="elearn-script"></div>
        </div>
        <div id="elearn-tags"></div>
      </div>
      <div id="tour-foot">
        <button id="tour-prev" type="button">← Back</button>
        <div id="tour-dots"></div>
        <button id="tour-next" type="button">Next →</button>
      </div>
    </div>
  `;
  document.body.appendChild(tip);

  document.getElementById("tour-next").addEventListener("click", advance);
  document.getElementById("tour-prev").addEventListener("click", retreat);
  document.getElementById("tour-x").addEventListener("click", closeTour);
  document.getElementById("elearn-next").addEventListener("click", () => { scenarioIdx = (scenarioIdx + 1) % SCENARIOS.length; renderScenario(); });
  document.getElementById("elearn-prev").addEventListener("click", () => { scenarioIdx = (scenarioIdx - 1 + SCENARIOS.length) % SCENARIOS.length; renderScenario(); });
  document.addEventListener("keydown", onKey);
  renderScenario();
}

// ── eLearning scenarios ────────────────────────────────────────────────────

function renderScenario() {
  const s = SCENARIOS[scenarioIdx];
  document.getElementById("elearn-setup").textContent  = s.setup;
  document.getElementById("elearn-script").textContent = s.script;
  document.getElementById("elearn-counter").textContent = `${scenarioIdx + 1}/${SCENARIOS.length}`;

  const tags = document.getElementById("elearn-tags");
  tags.innerHTML = SCENARIOS.map((sc, i) =>
    `<span class="etag${i === scenarioIdx ? " on" : ""}">${sc.icon} ${sc.tag}</span>`
  ).join("");

  tags.querySelectorAll(".etag").forEach((el, i) => {
    el.addEventListener("click", () => { scenarioIdx = i; renderScenario(); });
  });
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderStep(idx) {
  const step  = STEPS[idx];
  const total = STEPS.length;

  document.getElementById("tour-fill").style.width = `${((idx + 1) / total) * 100}%`;

  const labelEl = document.getElementById("tour-label");
  labelEl.textContent = step.label || "";
  labelEl.style.display = step.label ? "" : "none";

  document.getElementById("tour-ttl").textContent = step.title;
  document.getElementById("tour-body").innerHTML  = step.body;

  const hint = document.getElementById("tour-hint");
  if (step.tryHint) {
    hint.textContent = "👆 " + step.tryHint;
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }

  const prevBtn = document.getElementById("tour-prev");
  const nextBtn = document.getElementById("tour-next");
  prevBtn.style.visibility = idx === 0 ? "hidden" : "visible";
  nextBtn.textContent = idx === total - 1 ? "Finish ✓" : "Next →";

  // Show eLearning section only in desktop sidebar mode
  const elearn = document.getElementById("tour-elearn");
  if (elearn) elearn.hidden = !isDesktop();

  document.getElementById("tour-dots").innerHTML = STEPS.map((_, i) =>
    `<span class="tdot${i === idx ? " on" : ""}"></span>`
  ).join("");

  positionAll(step);
}

// ── Shared spotlight applier ───────────────────────────────────────────────
// Measures the target element and positions the spotlight + frame panels.
// Called both from the initial setTimeout and from the scroll/resize handler.

function applySpotlight(step, el) {
  const spotlight = document.getElementById("tour-spotlight");
  if (!spotlight || !el) return;

  const pad    = 12;
  const r      = el.getBoundingClientRect();
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;
  const left0  = isDesktop() ? SIDEBAR_W : 0;

  const sT = Math.max(0,     r.top    - pad);
  const sL = Math.max(left0, r.left   - pad);
  const sR = Math.min(vw,    r.right  + pad);
  const sB = Math.min(vh,    r.bottom + pad);
  const sW = Math.max(0, sR - sL);
  const sH = Math.max(0, sB - sT);

  spotlight.style.cssText = `display:block; top:${sT}px; left:${sL}px; width:${sW}px; height:${sH}px;`;

  clearFramePanels();
  addFramePanel(left0, 0,    vw - left0, sT,       true);  // top band
  addFramePanel(left0, sB,   vw - left0, vh - sB,  true);  // bottom band
  addFramePanel(left0, sT,   sL - left0, sH,       true);  // left of spotlight
  addFramePanel(sR,    sT,   vw - sR,    sH,       true);  // right of spotlight
  addFramePanel(sL,    sT,   sW,         sH,       !step.interactive);
}

// ── Scroll / resize tracking ───────────────────────────────────────────────

function onScroll() {
  if (!tourActive) return;
  const step = STEPS[currentStep];
  if (!step?.target) return;
  const el = document.querySelector(step.target);
  if (!el) return;
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  scrollRaf = requestAnimationFrame(() => applySpotlight(step, el));
}

// ── Desktop: sidebar layout ────────────────────────────────────────────────

function positionDesktop(step, tooltip) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spotlight = document.getElementById("tour-spotlight");

  tooltip.classList.add("is-sidebar");
  tooltip.style.cssText = "";

  if (!step.target) {
    spotlight.style.display = "none";
    clearFramePanels();
    addFramePanel(SIDEBAR_W, 0, vw - SIDEBAR_W, vh, true);
    return;
  }

  const el = document.querySelector(step.target);
  if (!el) {
    spotlight.style.display = "none";
    clearFramePanels();
    addFramePanel(SIDEBAR_W, 0, vw - SIDEBAR_W, vh, true);
    return;
  }

  el.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });

  posTimer = setTimeout(() => {
    if (!tourActive) return;
    applySpotlight(step, el);
  }, 80);
}

// ── Mobile: floating card ──────────────────────────────────────────────────

function positionMobile(step, tooltip) {
  tooltip.classList.remove("is-sidebar");
  const elearn = document.getElementById("tour-elearn");
  if (elearn) elearn.hidden = true;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spotlight = document.getElementById("tour-spotlight");

  if (!step.target) {
    spotlight.style.display = "none";
    clearFramePanels();
    addFramePanel(0, 0, vw, vh, true);
    centerTooltip(tooltip);
    return;
  }

  const el = document.querySelector(step.target);
  if (!el) {
    spotlight.style.display = "none";
    clearFramePanels();
    addFramePanel(0, 0, vw, vh, true);
    centerTooltip(tooltip);
    return;
  }

  el.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });

  posTimer = setTimeout(() => {
    if (!tourActive) return;
    applySpotlight(step, el);

    // Float the tooltip card above or below the spotlight
    const r   = el.getBoundingClientRect();
    const pad = 12;
    const sT  = Math.max(0,  r.top    - pad);
    const sB  = Math.min(vh, r.bottom + pad);
    const sL  = Math.max(0,  r.left   - pad);
    const tw  = Math.min(252, vw - 20);
    const below = vh - sB;
    const above = sT;
    const gap   = 10;
    const tipL  = Math.max(8, Math.min(sL, vw - tw - 8));

    let posCSS;
    if (below >= above && below >= 110) {
      posCSS = `top:${sB + gap}px; bottom:auto;`;
    } else if (above >= 110) {
      posCSS = `bottom:${vh - sT + gap}px; top:auto;`;
    } else {
      posCSS = below >= above ? `bottom:6px; top:auto;` : `top:6px; bottom:auto;`;
    }

    tooltip.style.cssText = `position:fixed; width:${tw}px; max-width:${tw}px; left:${tipL}px; ${posCSS}`;
  }, 80);
}

// ── Router ─────────────────────────────────────────────────────────────────

function positionAll(step) {
  if (posTimer) { clearTimeout(posTimer); posTimer = null; }
  const tooltip = document.getElementById("tour-tooltip");
  if (isDesktop()) {
    positionDesktop(step, tooltip);
  } else {
    positionMobile(step, tooltip);
  }
}

function isDesktop() {
  return window.innerWidth >= DESKTOP_BP;
}

// ── Frame panel helpers ────────────────────────────────────────────────────

function addFramePanel(left, top, width, height, blockClicks) {
  if (width <= 0 || height <= 0) return;
  const d = document.createElement("div");
  d.className = "tour-frame";
  d.style.cssText = `
    position:fixed; z-index:9001;
    left:${left}px; top:${top}px;
    width:${width}px; height:${height}px;
    background:rgba(5,8,20,0.76);
    pointer-events:${blockClicks ? "all" : "none"};
  `;
  document.getElementById("tour-root").appendChild(d);
}

function clearFramePanels() {
  document.querySelectorAll(".tour-frame").forEach(el => el.remove());
}

function centerTooltip(tooltip) {
  tooltip.style.cssText = `position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:min(272px,88vw);`;
}

// ── Navigation ─────────────────────────────────────────────────────────────

function advance() {
  if (currentStep >= STEPS.length - 1) { closeTour(); return; }
  currentStep++;
  renderStep(currentStep);
}

function retreat() {
  if (currentStep > 0) { currentStep--; renderStep(currentStep); }
}

function onKey(e) {
  if (!tourActive) return;
  if (e.key === "ArrowRight") advance();
  if (e.key === "ArrowLeft")  retreat();
  if (e.key === "Escape")     closeTour();
}

function closeTour() {
  tourActive = false;
  if (posTimer) clearTimeout(posTimer);
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  document.removeEventListener("keydown", onKey);
  document.getElementById("tour-root")?.remove();
  document.getElementById("tour-tooltip")?.remove();
}

// ── Styles ─────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById("tour-styles")) return;
  const s = document.createElement("style");
  s.id = "tour-styles";
  s.textContent = `
    /* ── Root ── */
    #tour-root { position:fixed; inset:0; z-index:9000; pointer-events:none; }

    /* ── Spotlight ring ── */
    #tour-spotlight {
      position: fixed;
      border-radius: 12px;
      pointer-events: none;
      z-index: 9002;
      background: rgba(255, 255, 255, 0.06);
      box-shadow:
        0 0 0 3px #ffe000,
        0 0 0 6px rgba(255,224,0,0.18),
        0 0 32px rgba(255,224,0,0.25);
      transition: top .22s ease, left .22s ease, width .22s ease, height .22s ease;
    }

    /* ── Tooltip / sidebar card ── */
    #tour-tooltip {
      position: fixed;
      z-index: 99999;
      pointer-events: all;
      background: #12151f;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
      box-shadow:
        0 2px 0 0 rgba(255,224,0,0.55),
        0 32px 80px rgba(0,0,0,0.75),
        inset 0 1px 0 rgba(255,255,255,0.05);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      transition: top .22s ease, bottom .22s ease, left .22s ease;
    }

    /* ── Desktop sidebar mode ── */
    #tour-tooltip.is-sidebar {
      left: 0 !important;
      top: 0 !important;
      width: ${SIDEBAR_W}px !important;
      height: 100vh !important;
      border-radius: 0 !important;
      border-left: none !important;
      border-top: none !important;
      border-bottom: none !important;
      border-right: 1px solid rgba(255,255,255,0.08) !important;
      display: flex !important;
      flex-direction: column !important;
      transform: none !important;
      box-shadow:
        4px 0 32px rgba(0,0,0,0.6),
        inset -1px 0 0 rgba(255,255,255,0.06) !important;
    }
    #tour-tooltip.is-sidebar #tour-bar { flex-shrink: 0; }
    #tour-tooltip.is-sidebar #tour-inner {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px 18px 20px;
      overflow-y: auto;
    }
    #tour-tooltip.is-sidebar #tour-body {
      font-size: 13px;
      line-height: 1.6;
      color: rgba(255,255,255,0.55);
      flex: 1;
    }
    #tour-tooltip.is-sidebar #tour-ttl {
      font-size: 17px;
      margin-bottom: 10px;
      line-height: 1.2;
    }
    #tour-tooltip.is-sidebar #tour-top { margin-bottom: 12px; }
    #tour-tooltip.is-sidebar #tour-hint {
      margin-top: 14px;
      padding: 8px 12px;
      font-size: 12px;
    }
    #tour-tooltip.is-sidebar #tour-foot {
      margin-top: 24px;
      flex-shrink: 0;
      padding-right: 0;
    }
    #tour-tooltip.is-sidebar #tour-dots { display: none; }
    #tour-tooltip.is-sidebar #tour-prev,
    #tour-tooltip.is-sidebar #tour-next {
      flex: 1;
      padding: 9px 10px;
      font-size: 13px;
      text-align: center;
    }

    /* Progress bar */
    #tour-bar { height:3px; background:rgba(255,255,255,0.06); flex-shrink:0; }
    #tour-fill { height:100%; background:#ffe000; transition:width .35s ease; border-radius:0 2px 2px 0; }

    /* Inner padding */
    #tour-inner { padding: 10px 13px 12px; }

    /* Top row: label + close */
    #tour-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 7px;
    }
    #tour-label {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #ffe000;
      background: rgba(255,224,0,0.1);
      padding: 2px 7px;
      border-radius: 20px;
      border: 1px solid rgba(255,224,0,0.2);
    }
    #tour-x {
      background: none; border: none;
      color: rgba(255,255,255,0.3);
      font-size: 13px; cursor: pointer;
      padding: 2px 4px; border-radius: 5px;
      transition: color .15s, background .15s;
      pointer-events: all;
      line-height: 1;
    }
    #tour-x:hover { color:#fff; background:rgba(255,255,255,0.08); }

    /* Title */
    #tour-ttl {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      line-height: 1.25;
      margin-bottom: 5px;
      letter-spacing: -0.1px;
    }

    /* Body */
    #tour-body {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      line-height: 1.55;
    }
    #tour-body strong { color: rgba(255,255,255,0.82); font-weight: 600; }

    /* Hint bar */
    #tour-hint {
      margin-top: 8px;
      padding: 6px 10px;
      background: rgba(255,224,0,0.07);
      border: 1px solid rgba(255,224,0,0.18);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,224,0,0.88);
    }

    /* Footer */
    #tour-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-top: 12px;
      padding-right: 1px;
    }
    #tour-prev {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.4);
      border-radius: 7px;
      padding: 6px 11px;
      font-size: 12px; font-weight: 600;
      cursor: pointer;
      transition: background .15s, color .15s;
      white-space: nowrap;
      pointer-events: all;
    }
    #tour-prev:hover { background:rgba(255,255,255,0.1); color:#fff; }

    #tour-next {
      background: #ffe000;
      border: none;
      color: #0d1018;
      border-radius: 7px;
      padding: 6px 14px;
      font-size: 12px; font-weight: 700;
      cursor: pointer;
      transition: background .15s, transform .1s;
      white-space: nowrap;
      pointer-events: all;
    }
    #tour-next:hover  { background:#ffd000; }
    #tour-next:active { transform:scale(0.97); }

    /* Dots */
    #tour-dots { display:flex; gap:4px; align-items:center; flex:1; justify-content:center; }
    .tdot {
      width:4px; height:4px; border-radius:50%;
      background:rgba(255,255,255,0.15);
      transition:background .2s, width .2s;
    }
    .tdot.on { background:#ffe000; width:10px; border-radius:2px; }

    /* eLearning never shows outside sidebar mode */
    #tour-tooltip:not(.is-sidebar) #tour-elearn { display: none !important; }

    /* ── eLearning panel (desktop sidebar only) ── */
    #tour-elearn {
      margin-top: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      border-top: 1px solid rgba(255,255,255,0.07);
      padding-top: 14px;
    }
    #elearn-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    #elearn-heading {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
    }
    #elearn-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #elearn-nav button {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.4);
      border-radius: 5px;
      width: 20px; height: 20px;
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
      padding: 0;
    }
    #elearn-nav button:hover { background: rgba(255,255,255,0.12); color:#fff; }
    #elearn-counter {
      font-size: 9px;
      color: rgba(255,255,255,0.25);
      font-weight: 600;
      min-width: 24px;
      text-align: center;
    }
    #elearn-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 11px 12px;
      flex: 1;
      overflow-y: auto;
    }
    #elearn-setup {
      font-size: 10px;
      font-weight: 600;
      color: rgba(255,224,0,0.6);
      letter-spacing: 0.3px;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.8px;
    }
    #elearn-script {
      font-size: 12px;
      color: rgba(255,255,255,0.65);
      line-height: 1.6;
      font-style: italic;
    }
    #elearn-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 10px;
    }
    .etag {
      font-size: 9.5px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.3);
      cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
      white-space: nowrap;
    }
    .etag:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
    .etag.on {
      background: rgba(255,224,0,0.1);
      border-color: rgba(255,224,0,0.3);
      color: rgba(255,224,0,0.85);
    }

    /* Make body not flex:1 when elearn is present so elearn fills the space */
    #tour-tooltip.is-sidebar #tour-body {
      font-size: 13px;
      line-height: 1.6;
      color: rgba(255,255,255,0.55);
      flex: 0;
    }

    /* Gate logo hint */
    .gate-logo-hint {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      font-weight: 500;
    }

    /* Pulse on BB mark */
    @keyframes tour-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,224,0,0); }
      50%      { box-shadow: 0 0 0 8px rgba(255,224,0,0.2); }
    }
    .gate-logo .bb-mark {
      animation: tour-pulse 2.4s ease-in-out infinite;
      border-radius: 4px;
    }
    .gate-logo:hover .bb-mark { animation: none; }
  `;
  document.head.appendChild(s);
}
