# BB Open Box Finder — Deploy Guide

## Deploy to Vercel (5 minutes)

### Option A: Drag & Drop (easiest, no CLI needed)
1. Go to vercel.com → Log in with GitHub
2. Click **"Add New Project"**
3. Drag the entire `bb-openbox` folder onto the page
4. Vercel auto-detects it → click **Deploy**
5. You get a live URL like `bb-openbox-finder.vercel.app`
6. Open on any phone/tablet in store ✅

### Option B: CLI (if you have Node installed)
```bash
npm i -g vercel
cd bb-openbox
vercel --prod
```

---

## Add to Home Screen (looks like a real app)

**iPhone (Safari):**
1. Open the URL in Safari
2. Tap the Share button → "Add to Home Screen"
3. Name it "Open Box Finder"
4. It opens full-screen, no browser bar — looks native

**Android (Chrome):**
1. Open URL in Chrome
2. Tap ⋮ menu → "Add to Home Screen"

---

## Features
- Search by name, SKU, or model
- Filter by category (TVs, Laptops, Appliances, etc.)
- Filter by condition (Excellent / Good / Satisfactory)
- Sort by $ saved, % off, price
- One-tap SKU copy to clipboard
- Tap any card → expand sell notes
- AI Advisor (Claude) — type a customer scenario, get instant deal recs
- Hot Deal ribbon on 40%+ off items
- Stats bar showing avg savings, best deal, excellent unit count

---

## For the Pitch
Key talking points:
- IROC/Connect has no quick way to surface open box by condition + savings
- This finds the right deal in under 10 seconds vs 2+ minutes of manual lookups
- Faster open box turnover = less depreciation write-down for corporate
- Associate confidence goes up → more open box sold
- Could integrate directly into Best Buy Connect with employee SSO
