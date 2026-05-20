# Biospecimen Study Lifetime Cost Calculator (B$LCC)

B$LCC is an interactive browser application for modeling biospecimen costs across the study lifecycle. Users adjust operational and financial levers to view per-sample and total-study impact in real time.

## Application Summary

- Name: B$LCC (Biospecimen Study Lifetime Cost Calculator)
- Package: `codespaces-react`
- Primary use case: Modeling costs of clinical biospecimen collections individually and for the life of the study
- Primary users: CLBM, GDO, clinical study design decision-makers, clinical study implementation stakeholders

## What the App Does

The model computes:

1. End-to-end per-sample cost (`C_sample`)
2. Total sample volume (`N_samples`)
3. Total cost for study (`TRUE_COST`)
4. Total shipments required
5. Cost component values for Kitting & Site (K), Logistics (L), Testing (T), Storage (S), and Disposal (D)

Cost formulas:

- `N_samples = N_subjects * N_visits * N_timepoints * N_aliquots`
- `C_sample = K + L + T + S + D`
- `TRUE_COST = C_sample * N_samples`

Input model includes 20 configurable levers grouped by:

- Kitting & Site
- Logistics
- Testing
- Storage
- Disposal

## App Workflow

### Calculator

- Interactive levers update outputs instantly.
- Donut and bar visualizations show cost composition and top drivers.
- Users can lock the current configuration as a baseline.

### What-If Scenarios

- Presets (`s1` to `s4`) apply scenario overlays to the locked baseline.
- Manual edits are supported and transition the assumptions panel to custom mode.
- Reset returns scenario values to the locked baseline.
- Delta visualization includes:
	- Per-sample K/L/T/S/D deltas
	- Total-study delta with signed percent handling, including zero-baseline guard

### Store or Dispose

- Upcoming Module

## Technical Stack and Setup

### Stack

- React 18
- Vite 6
- Recharts 3
- JavaScript/JSX (no TypeScript)

### Architecture Notes

- Client-side SPA with static build output
- No backend or external API integrations
- In-memory React state only (`calculatorInputs`, `lockedInputs`, `scenarioInputs`, `activeScenario`, `activeTab`)
- No persistence layer (no database, queue, or local storage) [Coming Later]
- PWA manifest present (`public/manifest.json`) — progressive web app installability configured

## Quality and Current State

- Current maturity: advanced MVP / pre-production — core calculator and scenario modeling workflows are complete and robust
- **Structural refactor complete:** `App.jsx` reduced from ~850 lines to 165 lines; logic decomposed into `constants.js`, `utils.js`, `calculate.js`, dedicated components, and view-level modules
- **Pure calculation layer:** exported `calculate()` function is isolated and fully unit-testable with no side effects
- **Defensive math:** zero-volume, zero-denominator, and zero-baseline edge cases handled throughout
- Automated tests: 12+ test cases covering lock/unlock flow, preset application, reset behavior, delta sidebar rendering, zero-baseline percent guard, zero-volume output correctness, and `T_data_total` normalization

## Code Locations

| File / Folder | Responsibility |
|---|---|
| `src/constants.js` | Single source of truth for `COLORS`, `CONFIG` (all 20 levers), `PRESETS`, `SCENARIO_LABELS`, `SCENARIO_META`, `DEFAULTS`, `GROUP_ABBREV` |
| `src/utils.js` | Pure utility functions: formatting, math helpers (`clamp`, `ceilDiv`), UI helpers |
| `src/calculate.js` | Exported `calculate()` pure function; all cost math; returns `C_sample`, `TRUE_COST`, `N_samples`, shipment count, and K/L/T/S/D segments |
| `src/App.jsx` | Root component (165 lines); application state, tab routing, lock/reset/applyScenario handlers |
| `src/App.css` | Layout, theming, and component styling (CSS custom property design tokens) |
| `src/views/CalculatorView.jsx` | Calculator tab: sample levers, study volume levers, cost composition, breakdown chart, assumptions panel |
| `src/views/ScenariosView.jsx` | What-If tab: preset buttons, editable levers, locked/scenario cards, delta comparison chart |
| `src/views/StoreDisposeView.jsx` | Placeholder shell for the upcoming Store or Dispose module |
| `src/components/` | 6 reusable UI components: `CostComposition`, `BreakdownChart`, `DeltaComparisonChart`, `NumberControl`, `DonutTooltip`, `AssumptionsCaveats` |