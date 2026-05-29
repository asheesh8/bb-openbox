# BB Open Box Finder

A progressive web app for Best Buy store associates to surface, filter, and pitch open box deals in real time. Hooks into the Best Buy Open Box API and the Anthropic Messages API.

---

## What it does

Associates land on a grid of open box deals scoped to their store. They can filter by department, brand, condition, price range, and sort by savings or rating. Tapping a card expands coaching notes tailored to the condition tier — what to lead with, how to anchor on the savings, what to acknowledge upfront. From there they can add items to a comparison tray, build a customer basket, run the AI advisor for a quick recommendation, and copy a full quote with tax and membership math to their clipboard.

The sales workbench on the right pulls together member lookup (demo), membership attach (Plus vs Total), Best Buy Card financing/rewards math, the compare tray, the quote basket, and a favorites list that persists across sessions.

---

## Module Map

```
src/scripts/
  main.js                         entry point — cross-cutting events, app startup
  state/
    appState.js                   singleton state object imported everywhere
  config/
    productDepartments.js         department tabs, category IDs, filters, spec parsers
    storeLocations.js             store IDs, tax rates, pickup context
  data/
    sampleOpenBoxItems.js         demo catalog — used when no API key is present
  services/
    bestBuyInventoryApi.js        Best Buy Open Box + Products API calls
    aiAdvisorService.js           Anthropic Messages API + local keyword fallback
    storageService.js             all localStorage keys in one place
  utils/
    productUtils.js               filtering, sorting, keying — no DOM access
    membershipUtils.js            plan cost, name, and benefits
    htmlUtils.js                  escapeHtml, active filter chips
    quoteUtils.js                 clipboard text builders for quote and favorites
  ui/
    toast.js                      showToast with optional action button
    storePanel.js                 store dropdown and summary card
    inventoryStatus.js            live / sample data indicator
    departmentNav.js              department tab switching
    filterBar.js                  filter pills and sort select
    productGrid.js                card grid, card HTML builder, card actions
    salesWorkbench.js             member, attach, card offer, compare, quote, favorites
    modals.js                     LPN info modal and favorites pop-up
    aiAdvisor.js                  AI overlay event wiring
    installPrompt.js              PWA install prompt and service worker registration
```

---

## Architecture Diagrams

### Module Dependency Graph

```mermaid
flowchart TD
  main["main.js\nentry point"]

  subgraph state
    appState["appState.js"]
  end

  subgraph config
    depts["productDepartments.js"]
    stores["storeLocations.js"]
  end

  subgraph services
    bbApi["bestBuyInventoryApi.js"]
    aiSvc["aiAdvisorService.js"]
    storage["storageService.js"]
  end

  subgraph utils
    productUtils["productUtils.js"]
    memberUtils["membershipUtils.js"]
    htmlUtils["htmlUtils.js"]
    quoteUtils["quoteUtils.js"]
  end

  subgraph ui
    toast["toast.js"]
    storePanel["storePanel.js"]
    deptNav["departmentNav.js"]
    filterBar["filterBar.js"]
    productGrid["productGrid.js"]
    salesWB["salesWorkbench.js"]
    modals["modals.js"]
    aiAdvisor["aiAdvisor.js"]
    installPrompt["installPrompt.js"]
    invStatus["inventoryStatus.js"]
  end

  main --> appState
  main --> bbApi
  main --> storage
  main --> storePanel & deptNav & filterBar & productGrid & salesWB & invStatus & modals & aiAdvisor & installPrompt

  bbApi --> depts
  aiSvc --> appState & memberUtils
  productUtils --> appState & depts
  memberUtils --> appState
  htmlUtils --> appState & depts
  quoteUtils --> appState & productUtils & memberUtils & storePanel

  productGrid --> appState & depts & productUtils & htmlUtils & storage & toast & salesWB & modals
  salesWB --> appState & depts & productUtils & memberUtils & storage & storePanel & productGrid
  deptNav --> appState & depts & productUtils & filterBar & productGrid
  filterBar --> appState & depts & productGrid
  storePanel --> appState & stores
  aiAdvisor --> appState & productUtils & aiSvc
  modals --> appState & productUtils & storage & salesWB & productGrid
  installPrompt --> appState & storage & toast
  invStatus --> appState
  toast --> htmlUtils
```

### Domain Model

```mermaid
classDiagram
  class AppState {
    +string apiKey
    +boolean isDemoMode
    +OpenBoxItem[] allProducts
    +Date lastFetchedAt
    +string selectedDeptId
    +string selectedStoreId
    +object selectedFilters
    +string searchText
    +string sortMode
    +string expandedProductKey
    +string[] comparisonKeys
    +string[] quoteKeys
    +string[] favoriteKeys
    +string membershipPlan
    +MemberSession selectedMember
  }

  class Department {
    +string id
    +string label
    +string icon
    +string[] cats
    +Filter[] filters
    +parseSpec(name, desc) string[]
    +brandFromName(name) string
  }

  class Filter {
    +string id
    +string label
    +string type
    +string[] opts
  }

  class Store {
    +string id
    +string label
    +string city
    +string state
    +string bbStoreId
    +number tax
    +string pickup
    +string region
  }

  class OpenBoxItem {
    +string sku
    +string name
    +string desc
    +string category
    +number reg
    +number sale
    +number savings
    +number pct
    +string cond
    +number rating
    +number reviews
    +string img
    +string url
    +string[] specs
    +string brand
  }

  class MemberSession {
    +string name
    +string handle
    +string tier
    +boolean hasCard
    +string cardType
    +string rewards
    +string financing
  }

  Department "1" o-- "*" Filter
  Department --> "*" OpenBoxItem : categorizes
  Store --> "*" OpenBoxItem : scopes inventory
  AppState --> Store : selectedStoreId
  AppState --> MemberSession
  AppState --> OpenBoxItem : compare · quote · favorites
```

### Live Inventory Sequence

```mermaid
sequenceDiagram
  actor Associate
  participant main as main.js
  participant api as bestBuyInventoryApi.js
  participant OpenBox as Best Buy Open Box API
  participant Products as Best Buy Products API
  participant grid as productGrid.js

  Associate->>main: Enter API key
  main->>api: verifyBestBuyApiKey(key)
  api->>OpenBox: GET openBox pageSize=1
  OpenBox-->>api: 200 OK
  api-->>main: true

  main->>api: fetchOpenBoxInventory(key, store)
  loop each department category (parallel)
    api->>OpenBox: GET openBox(categoryId, storeId, pageSize=100)
    OpenBox-->>api: offers[]
    loop each unique SKU+condition
      api->>Products: GET /products/{sku}.json
      Products-->>api: shortDescription, manufacturer
      api->>api: normalize → OpenBoxItem
    end
  end
  api-->>main: OpenBoxItem[]
  main->>grid: renderProductGrid()
  grid->>grid: filter → sort → build card HTML
```

### Quote Build Flow

```mermaid
sequenceDiagram
  actor Associate
  participant grid as productGrid.js
  participant state as appState.js
  participant wb as salesWorkbench.js
  participant quote as quoteUtils.js
  participant clip as Clipboard API

  Associate->>grid: Tap "＋ Basket" on a card
  grid->>state: push to quoteKeys[]
  grid->>wb: renderSalesWorkbench()
  wb->>wb: subtotal + membership + tax + savings
  wb->>wb: Render quote panel rows and totals

  Associate->>wb: Tap "Copy Quote"
  wb->>quote: buildQuoteText()
  quote->>state: read quoteKeys, selectedMember, store, membershipPlan
  quote-->>wb: formatted string
  wb->>clip: navigator.clipboard.writeText()
  wb->>grid: showToast("Quote copied")
```

### AI Advisor Flow

```mermaid
sequenceDiagram
  actor Associate
  participant overlay as aiAdvisor.js
  participant utils as productUtils.js
  participant svc as aiAdvisorService.js
  participant claude as Anthropic Messages API

  Associate->>overlay: Type query → tap Go
  overlay->>utils: getVisibleProducts().slice(0,10)
  utils-->>overlay: top 10 visible items

  alt live mode
    overlay->>svc: fetchLiveAdvisorResponse(query, items)
    svc->>claude: POST /v1/messages (inventory context)
    claude-->>svc: recommendation text
    svc-->>overlay: text
  else demo mode or API error
    overlay->>svc: buildLocalAdvisorResponse(query, items)
    svc->>svc: keyword filter → sort → pick top 3
    svc-->>overlay: formatted picks + attach note
  end

  overlay->>overlay: render text in result panel
```

---

## Data Flow Overview

```mermaid
flowchart LR
  BB["Best Buy\nOpen Box API"] -->|"pageSize=100 per category"| api["bestBuyInventoryApi.js"]
  BB2["Best Buy\nProducts API"] -->|"shortDescription per SKU"| api
  api -->|"OpenBoxItem[]"| state["appState.js\nallProducts"]

  state -->|"filter + sort"| grid["productGrid.js"]
  state -->|"quoteKeys, favoriteKeys"| wb["salesWorkbench.js"]
  state -->|"persist"| ls["localStorage"]

  grid --> dom["Product cards"]
  wb --> dom2["Quote panel · Compare · Favorites"]
```

---

## Key Design Decisions

**Single state object.** All mutable app state lives in `state/appState.js` as a plain object imported by any module that needs it. No prop-drilling, no event bus, no framework overhead. Mutating `state.quoteKeys` anywhere immediately reflects in the next render call.

**Services have no DOM access.** `services/` modules only do network calls and storage reads. They can be tested independently or swapped out — e.g. when Best Buy provides their real API endpoint, only `bestBuyInventoryApi.js` changes.

**UI modules call each other directly.** `productGrid.js` and `salesWorkbench.js` import from each other for re-renders after state changes. ES modules handle circular imports fine because the actual calls happen inside function bodies at runtime, not at load time.

**AI advisor has a local fallback.** `aiAdvisorService.js` exports both `fetchLiveAdvisorResponse` (Anthropic API) and `buildLocalAdvisorResponse` (keyword-based). Demo mode and API failures both land on the local path — no broken UI, no empty state.

**Adding a store or department touches one file.** New stores go in `config/storeLocations.js`. New departments go in `config/productDepartments.js` with their own `cats`, `filters`, `parseSpec`, and `brandFromName`. Nothing else needs to change.
