# Application Technical Summary

**Generated:** 2026-05-08

---

## 1. Application Overview

- **Application Name:** B$LCC — Biospecimen Study Lifetime Cost Calculator
  *(Package name: `codespaces-react`; version `0.1.0`)*
- **Purpose:** A browser-based, interactive financial modeling tool that calculates the total per-sample and total-study cost of biospecimen operations across the full lifecycle of a clinical or research study. Users configure 20 cost parameters across six categories (Volume, Kitting & Site, Logistics, Testing, Storage, Disposal) and receive real-time cost breakdowns with visualizations.
- **Intended Users:** Clinical research operations staff, biospecimen program managers, study budget/finance analysts, and clinical trial sponsors who need rapid cost estimates for specimen handling logistics.

---

## 2. Core Functionality

### Key Features
- **Interactive Cost Calculator** — 20 configurable numeric inputs (with sliders), organized into cost-driver categories, update results in real time without any server round-trips.
- **Cost Formula Engine** — Calculates cost per sample using the formula:
  `C_sample = K (Kitting & Site) + L (Logistics) + T (Testing) + S (Storage) + D (Disposal)`
  and derives total study cost by multiplying by total sample count (`Subjects × Visits × Timepoints × Aliquots`).
- **Data Visualizations** — Horizontal bar chart for cost category ranking and a donut (pie) chart for proportional breakdown, both rendered with Recharts.
- **Summary Metrics Panel** — Displays cost per sample, total study cost, total samples, total shipments required, and the top cost driver.
- **What-If Scenarios Tab** — Four predefined biospecimen lifecycle profiles that pre-populate the calculator:
  | Scenario | Description |
  |---|---|
  | S1 | Direct to Central Lab, Single Analysis, No LTS/Residuals |
  | S2 | Central Lab → Residual LTS (5-Year Consent) |
  | S3 | Central Lab → Specialty Lab → Residual LTS (5-Year Consent) |
  | S4 | LTS Only — No Central Lab routing or testing |
- **Assumptions & Caveats Panel** — Inline documentation of model normalization assumptions surfaced directly to users.
- **"Store or Dispose" Tab** — Placeholder tab (labeled "Soon") for a planned storage vs. disposal what-if module (not yet implemented).

### Major Components
| Component | Responsibility |
|---|---|
| `App` | Root component; manages global state (`useState`), tab routing, scenario selection |
| `calculate()` | Pure function; performs all financial computations from current input state |
| `CostComposition` | Renders the donut chart, cost-per-sample heading, equation line, and key metrics |
| `BreakdownChart` | Renders the horizontal bar chart of cost categories |
| `NumberControl` | Reusable input control (number field + optional range slider) |
| `AssumptionsCaveats` | Static informational block embedded in the sidebar |
| `DonutTooltip` | Custom Recharts tooltip for the pie chart |

### External Integrations
- **None** — The application is entirely client-side. All computation and rendering occur in the browser. No external APIs, authentication services, or backend calls are used.

---

## 3. Technical Architecture

### Tech Stack
| Layer | Technology |
|---|---|
| UI Framework | React 18.2.0 (functional components, hooks) |
| Charting | Recharts 3.8.1 (BarChart, PieChart, ResponsiveContainer) |
| Build Tool | Vite 6.3.6 with `@vitejs/plugin-react` |
| Testing | Vitest 3.0.7 + React Testing Library 13.4.0 + jest-dom |
| Language | JavaScript (JSX) — no TypeScript |
| Styling | Plain CSS (custom properties/variables, dark glassmorphism theme) |
| Performance | `web-vitals` 3.1.0 wired up in `reportWebVitals.js` (logging not configured) |

### Runtime & Deployment Model
- **Runtime:** Browser-only SPA; no server-side rendering, no API server.
- **Development server:** Vite dev server on port 3000 (`npm start`).
- **Production build:** Static assets via `vite build`; output is deployable to any static file host (CDN, GitHub Pages, Netlify, etc.).
- **PWA-ready:** `manifest.json` and `<link rel="manifest">` are present, enabling installability on mobile and desktop — though no service worker is registered.

### Data Stores & Messaging
- **None.** All state is held in React component memory (`useState`). No localStorage, IndexedDB, cookies, or external data stores are used. Data does not persist across page reloads.

---

## 4. Current State

### Maturity Level
**Early MVP / V1.0.** The project description in the README is still the generic GitHub Codespaces template boilerplate. The commit message explicitly labels this release "V1.0 of the react app converted from SPA html," indicating the app was recently migrated from a standalone HTML prototype.

### Code Quality Observations
- Clean functional component architecture with correct use of `useMemo` for expensive derived values (cost groups, calculation results), avoiding unnecessary re-computation.
- All configuration (parameter definitions, presets, scenario labels) is declared as top-level constants in `App.jsx`, making it easy to extend without touching component logic.
- Input clamping and NaN guards are handled consistently in `updateValue`.
- Minor concern: `index.css` and `App.css` both declare `body` styles, creating redundancy.
- No TypeScript — type safety relies on developer convention and runtime guards (`Number.isNaN`, `Math.max(1, ...)` to avoid divide-by-zero).
- No separation of concerns between data/config and UI — all logic lives in a single `App.jsx` file (~480 lines). Acceptable at current scale; may become harder to maintain as features grow.

### Test Coverage
- **Minimal.** A single smoke test (`App.test.jsx`) verifies that the main heading renders. No tests exist for the calculation engine (`calculate()`), individual components, or scenario behavior.
- Test infrastructure is fully configured (Vitest + jsdom + Testing Library), so expanding coverage is straightforward.

### Known Technical Debt / Risks
- The generic `manifest.json` still has `"name": "Create React App Sample"` — not updated for this application.
- `reportWebVitals` is called without a callback, so no performance data is actually captured or reported.
- No error boundaries — a rendering crash in any component will blank the entire app.
- No input validation beyond numeric clamping; non-numeric keyboard input is passed through to `Number()`, which the `Number.isNaN` guard catches but silently ignores.

---

## 5. Recent Updates

### Git Commit History (last 10 commits)
| Hash | Message |
|---|---|
| `baebfb1` | V1.0 of the react app converted from SPA html *(HEAD, main)* |
| `bd30001` | Initial commit |

### Summary
- The project has **two commits**. The repository was initialized from the GitHub Codespaces React template (`bd30001`) and then the entire application — calculator logic, scenarios, charts, and dark-theme styling — was added in a single commit (`baebfb1`). This confirms the application was developed externally as a standalone HTML/JS file and then ported to React in one pass.
- **Active development area:** The entire codebase is recent; the calculator tab and scenarios tab are the areas of primary current functionality.

---

## 6. Roadmap (If Discernible)

### Explicitly Documented (in code)
- **"Store or Dispose" module** — A third tab is present in the navigation bar with the label "Store or Dispose" and a badge reading "Soon." The tab renders a placeholder page: *"Storage and disposal what-if module is coming soon."* This feature is planned and was scaffolded intentionally.

### Inferred from Codebase
*(The following items are inferences, not explicitly documented plans.)*

- **Scenario expansion** — The scenario system (`PRESETS`, `SCENARIO_LABELS`, `SCENARIO_META`) is data-driven and easy to extend; additional biospecimen lifecycle patterns may be added.
- **PWA completion** — A service worker could be added to enable offline use and full PWA installability, given the manifest is already wired up.
- **Performance telemetry** — The `reportWebVitals` hook is integrated but inactive; a future step would be routing those metrics to an analytics endpoint.
- **Test expansion** — The test infrastructure is in place but underutilized; unit tests for the `calculate()` function are a natural near-term addition.
- **TypeScript migration** — `jsconfig.json` is minimal (`"moduleResolution": "node"`); a `tsconfig.json` migration could improve long-term maintainability.

---

## 7. Notable Observations

### Strengths
- The core domain logic (`calculate()`) is a clean, pure function — easy to unit test and reason about independently of the UI.
- The `CONFIG` array architecture makes adding or removing cost parameters a one-line change, with the UI and calculation engine automatically adapting.
- Responsive container usage in charts ensures the layout adapts gracefully to different screen widths.
- Dark-theme CSS design is polished and production-quality relative to the application's MVP maturity.

### Gaps & Ambiguities
- **No data persistence** — Users cannot save or share a specific cost configuration (no URL state, no export, no save-to-file). This is a likely friction point for the intended stakeholder audience.
- **No print/export** — No PDF export, CSV download, or copy-to-clipboard for results, which limits utility in reporting workflows.
- **Single component file** — As the "Store or Dispose" module and future features are built out, `App.jsx` will need to be split into multiple files/modules.
- **`manifest.json` not updated** — Still contains Create React App sample defaults; affects installed PWA appearance.

### Recommendations (Optional)
1. Add unit tests for `calculate()` covering edge cases (zero subjects, zero cost inputs, maximum values).
2. Implement URL-based state serialization so configurations can be bookmarked and shared.
3. Add a results export feature (CSV or PDF) for use in budget reports and proposals.
4. Update `manifest.json` with the correct app name, description, and icon assets.
5. Split `App.jsx` into separate component files ahead of the "Store or Dispose" module implementation.
