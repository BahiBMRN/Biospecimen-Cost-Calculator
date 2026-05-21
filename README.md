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

- Three sub‑tabs with local state only (no interference with Calculator/Scenarios):
	- Store: select Sample Type → Container Size → Storage Temperature → Duration → optional Total Samples. Shows per‑sample and total‑study cost with explicit formula: `Registration + (Storage Rate × Duration)`.
	- Dispose: select Sample Type → Container Size (informational) → optional Total Samples. Fixed per‑sample formula: `$1.22 + $2.32 = $3.54`.
	- Store & Dispose: combines storage and disposal; applies Registration once at storage, then Retrieval + Disposal for the disposal portion. Validation checklist appears until both sides are sufficiently configured.
- Slides map to the ≤4mL storage rate row by design.
- Total Study Cost tiles remain hidden until a positive Total Samples value is provided.

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

## Quality and Current State

- Current maturity: advanced MVP / pre-production — core calculator and scenario modeling workflows are complete and robust
- **Structural refactor complete:** logic decomposed into `constants.js`, `utils.js`, `calculate.js`, dedicated components, and view-level modules
- **Pure calculation layer:** exported `calculate()` and Store & Dispose helpers are isolated and unit-testable with no side effects
- **Defensive math:** zero-volume, zero-denominator, and zero-baseline edge cases handled throughout
- Automated tests: 12 test cases covering lock/unlock flow, preset application, reset behavior, delta sidebar rendering, zero-baseline percent guard, zero-volume output correctness, and `T_data_total` normalization
- Notes: Recharts emits dimension warnings in jsdom during tests; these are non-fatal.

## Code Locations

| File / Folder | Responsibility |
|---|---|
| `src/constants.js` | Single source of truth for `COLORS`, `CONFIG` (all 20 levers), `PRESETS`, `SCENARIO_LABELS`, `SCENARIO_META`, `DEFAULTS`, `GROUP_ABBREV` |
| `src/utils.js` | Pure utility functions: formatting, math helpers (`clamp`, `ceilDiv`), UI helpers |
| `src/calculate.js` | Exported `calculate()` pure function; Store & Dispose helpers `calculateStorage`, `calculateDisposal`, `calculateStoreAndDispose`; returns `C_sample`, `TRUE_COST`, `N_samples`, shipment count, and K/L/T/S/D segments |
| `src/App.jsx` | Root component; application state, tab routing (Calculator, What‑If, Store or Dispose), lock/reset/applyScenario handlers |
| `src/App.css` | Layout, theming, and component styling (CSS custom property design tokens) |
| `src/views/CalculatorView.jsx` | Calculator tab: sample levers, study volume levers, cost composition, breakdown chart, assumptions panel |
| `src/views/ScenariosView.jsx` | What-If tab: preset buttons, editable levers, locked/scenario cards, delta comparison chart |
| `src/views/StoreDisposeView.jsx` | Full Store & Dispose module view: local state, sub-tab routing, memoized calculations |
| `src/components/` | UI components including: `CostComposition`, `BreakdownChart`, `DeltaComparisonChart`, `NumberControl`, `DonutTooltip`, `AssumptionsCaveats`, `SDConfigPanel`, `SDOutputPanel` |

### Store & Dispose Data/Config Additions

- `src/constants.js`
	- `SD_SAMPLE_TYPES`, `SD_CONTAINER_SIZES`, `SD_STORAGE_TEMPS`, `SD_SAMPLE_TYPE_CONTAINERS`, `SD_STORAGE_RATES`, `SD_FIXED_RATES`
- `src/calculate.js`
	- `calculateStorage({ containerSize, storageTemp, storageDuration, totalSamples })`
	- `calculateDisposal({ totalSamples })`
	- `calculateStoreAndDispose(storeInputs, disposeInputs)`