# Biospecimen Study Lifetime Cost Calculator (B$LCC)

B$LCC is an interactive browser application for modeling biospecimen costs across the study lifecycle. Users adjust operational and financial levers to view per-sample and total-study impact in real time, layer in regional and timeline cost modifiers, evaluate tiered-assay testing strategies against a break-even pivot point, and export results to Excel or image.

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

- `N_samples = N_participants * N_visits * N_timepoints * N_aliquots`
- `C_sample = K + L + T + S + D`
- `TRUE_COST = C_sample * N_samples`

Each of K/L/T/S/D is computed from the 20 levers, then adjusted by two optional modifiers before being summed:

- **Regional multipliers** scale each of K/L/T/S/D by a per-category factor for the selected region (see [Regional Cost Modeling](#regional-cost-modeling) below).
- **Expedite surcharges** add a shipping surcharge to the freight portion of L and testing/reporting surcharges to T, before regional multipliers are applied (see [Expedite Timeline Modeling](#expedite-timeline-modeling) below).

Both modifiers default to neutral (region `us`, timeline `Standard`), reproducing the original K/L/T/S/D formulas exactly when left untouched.

Input model includes 20 configurable levers grouped by:

- Kitting & Site
- Logistics
- Testing
- Storage
- Disposal

### Regional Cost Modeling

- A **Region** selector (US baseline, EU, APAC, LATAM) applies a per-category multiplier to K/L/T/S/D. US is the neutral baseline (all factors = 1.0).
- A collapsible **"Fine-tune regional multipliers"** panel exposes all five multipliers as editable fields. Selecting a new region resets any fine-tuned values back to that region's preset; editing an individual multiplier overrides only that category (including setting it to exactly 0) while the others keep tracking the selected region.
- Available on both the Calculator and What-If Scenarios tabs.

### Expedite Timeline Modeling

- A **Timeline** selector (Standard, Expedited, Critical / Rush) applies percentage surcharges to shipping (the freight portion of Logistics), testing, and reporting (Testing's data-transfer portion), modeling the added cost of compressing the study timeline. Standard is neutral (0% surcharge on all three).
- A collapsible **"Fine-tune surcharges"** panel exposes the three surcharge percentages directly.
- Available on both the Calculator and What-If Scenarios tabs; locking a Standard baseline and switching a scenario to Expedited/Critical shows the cost impact directly in the delta comparison chart.

## App Workflow

### Calculator

- Interactive levers update outputs instantly.
- Region and Timeline selectors (with fine-tune panels) sit alongside the Study Levers.
- Donut and bar visualizations show cost composition and top drivers.
- Users can lock the current configuration as a baseline.
- Header toolbar: **Export to Excel**, **Save as Image**, and **Save as Preset** (saves the current configuration as a reusable custom preset).

### What-If Scenarios

- Presets (`s1` to `s4`) apply scenario overlays to the locked baseline.
- Region and Timeline selectors (with fine-tune panels) are also available here, layered on top of the locked baseline.
- Manual edits are supported and transition the assumptions panel to custom mode.
- Reset returns scenario values to the locked baseline.
- Delta visualization includes:
	- Per-sample K/L/T/S/D deltas
	- Total-study delta with signed percent handling, including zero-baseline guard
- **Custom presets:** the Presets panel supports saving the current scenario configuration as a named preset ("Save current as preset"), applying a saved preset (replaces the scenario configuration wholesale), and deleting a saved preset. Presets persist in the browser via `localStorage` and survive page reloads.
- Header toolbar: **Export to Excel**, **Save as Image**, and **Save as Preset**.

### Store or Dispose

- Three sub‑tabs with local state only (no interference with Calculator/Scenarios):
	- Store: select Sample Type → Container Size → Storage Temperature → Duration → optional Total Samples. Shows per‑sample and total‑study cost with explicit formula: `Registration + (Storage Rate × Duration)`.
	- Dispose: select Sample Type → Container Size (informational) → optional Total Samples. Fixed per‑sample formula: `$1.22 + $2.32 = $3.54`.
	- Store & Dispose: combines storage and disposal; applies Registration once at storage, then Retrieval + Disposal for the disposal portion. Validation checklist appears until both sides are sufficiently configured.
- Slides map to the ≤4mL storage rate row by design.
- Total Study Cost tiles remain hidden until a positive Total Samples value is provided.
- Header toolbar: **Export to Excel** and **Save as Image** (no preset saving — this module's inputs are independent of the cost model).

### Tiered Assays

A standalone tab for modeling tiered testing strategies (e.g., a 3-tier immunogenicity screen → confirm → titer cascade) against a single flat assay. It holds its own local state and does **not** read from or affect the Calculator/Scenarios cost model in any way — the flat-assay cost entered here is independent of the Calculator's Assay Cost lever.

- Configure per-tier cost and turnaround (days) for Screen, Confirm, and Titer, a Confirm Positivity Rate (% of screen-positives that confirm), an Expected/current Screen Positivity Rate, and a flat-assay cost + turnaround for comparison.
- Computes the **Pivot Point**: the break-even screen-positivity rate at which the tiered cascade and the flat assay cost the same per sample. Below the pivot, tiered is cheaper; above it, flat is cheaper.
- A crossover chart plots the tiered per-sample cost (rising with positivity) against the flat per-sample cost (constant), with the pivot marked and "Tiered cheaper" / "Flat cheaper" zones shaded, plus a marker for the current expected positivity rate.
- A Recommendation badge (Tiered / Flat / Either) reflects where the current expected positivity falls relative to the pivot.
- Handles edge cases explicitly: no downstream cost (confirm and titer costs are zero — compares screen cost directly to flat cost), tiered cheaper at every positivity rate, and flat cheaper at every positivity rate.
- An optional Total Number of Expected Samples input reveals cascade counts (screened, screen-positive, confirmed-positive/titered) and total tiered vs. flat study cost.
- A turnaround comparison shows the tiered cascade's worst-case resolution time (screen + confirm + titer) against the flat assay's turnaround.
- Header toolbar: **Export to Excel** and **Save as Image** (no preset saving).

## Technical Stack and Setup

### Stack

- React 18
- Vite 6
- Recharts 3
- ExcelJS (Excel export)
- html-to-image (image export)
- JavaScript/JSX (no TypeScript)

### Architecture Notes

- Client-side SPA with static build output
- No backend or external API integrations
- In-memory React state for the cost model: `calculatorInputs`, `lockedInputs`, `scenarioInputs`, `activeScenario`, `activeTab`, `customPresets`
- The Tiered Assays tab holds its own local component state, entirely independent of the cost-model state above
- **Persistence:** custom scenario presets are saved to `localStorage` (key `bslcc.customPresets.v1`) and survive page reloads. All other application state (calculator inputs, locked baseline, active tab, Store or Dispose and Tiered Assays inputs) remains in-memory only and resets on reload.

## Quality and Current State

- Current maturity: advanced MVP / pre-production — core calculator, scenario modeling, Store or Dispose, and Tiered Assays workflows are complete and robust
- **Structural refactor complete:** logic decomposed into `constants.js`, `utils.js`, `calculate.js`, dedicated components, and view-level modules
- **Pure calculation layer:** exported `calculate()`, Store & Dispose helpers, and Tiered Assays helpers are isolated and unit-testable with no side effects
- **Defensive math:** zero-volume, zero-denominator, and zero-baseline edge cases handled throughout; regional/expedite modifiers default to neutral so existing calculations are reproduced exactly when unused
- Automated tests: 100 test cases covering lock/unlock flow, preset application (built-in and custom), reset behavior, delta sidebar rendering, zero-baseline percent guard, zero-volume output correctness, `T_data_total` normalization, Store & Dispose workflows, regional multiplier application (including fine-tune overrides), expedite surcharge application, the full tiered-assay pivot-point decision matrix (normal / flat-always / tiered-always / no-downstream / clamping), export model builders, and custom preset persistence (including corrupt-storage guards)
- Notes: Recharts emits dimension warnings in jsdom during tests; these are non-fatal.

## Code Locations

| File / Folder | Responsibility |
|---|---|
| `src/constants.js` | Single source of truth for `COLORS`, `CONFIG` (all 20 levers), `PRESETS`, `SCENARIO_LABELS`, `SCENARIO_META`, `DEFAULTS`, `STARTUP_DEFAULTS`, `GROUP_ABBREV`, `REGIONS`, `EXPEDITE_TIERS`, `TIERED_DEFAULTS`, `TIERED_TIER_LABELS` |
| `src/utils.js` | Pure utility functions: formatting, math helpers (`clamp`, `ceilDiv`), UI helpers |
| `src/calculate.js` | Exported `calculate()` pure function (applies regional multipliers and expedite surcharges); Store & Dispose helpers `calculateStorage`, `calculateDisposal`, `calculateStoreAndDispose`; regional helpers `getRegionFactors`, `getEffectiveRegionFactors`; expedite helper `getExpediteSurcharges`; Tiered Assays helpers `calculateTieredAssay`, `buildPivotSeries` |
| `src/App.jsx` | Root component; application state, tab routing (Calculator, What‑If, Store or Dispose, Tiered Assays), lock/reset/applyScenario handlers, custom-preset save/apply/delete handlers |
| `src/App.css` | Layout, theming, and component styling (CSS custom property design tokens) |
| `src/views/CalculatorView.jsx` | Calculator tab: sample levers, study volume levers, region/expedite fine-tune panels, cost composition, breakdown chart, assumptions panel, export toolbar |
| `src/views/ScenariosView.jsx` | What-If tab: preset buttons (built-in and custom, with save/apply/delete), region/expedite fine-tune panels, editable levers, locked/scenario cards, delta comparison chart, export toolbar |
| `src/views/StoreDisposeView.jsx` | Full Store & Dispose module view: local state, sub-tab routing, memoized calculations, export toolbar |
| `src/views/TieredAssaysView.jsx` | Standalone Tiered Assays tab: local state, pivot-point calculation, crossover chart, cascade counts, export toolbar |
| `src/components/` | UI components including: `CostComposition`, `BreakdownChart`, `DeltaComparisonChart`, `NumberControl`, `DonutTooltip`, `AssumptionsCaveats`, `SDConfigPanel`, `SDOutputPanel`, `RegionPanel`, `ExpeditePanel`, `TieredAssaysConfigPanel`, `PivotChart`, `ExportToolbar` |
| `src/export/` | `download.js` (blob/data-URL download helpers), `exportModel.js` (pure export-model builders: `buildCalculatorExportModel`, `buildScenarioExportModel`, `buildSdExportModel`, `buildTieredExportModel`), `excelExport.js` (ExcelJS workbook construction and export), `imageExport.js` (html-to-image PNG export) |
| `src/presets/customPresets.js` | Custom preset persistence: `loadCustomPresets`, `saveCustomPreset`, `deleteCustomPreset` (`localStorage`-backed, defensive against missing/corrupt storage) |

### Store & Dispose Data/Config Additions

- `src/constants.js`
	- `SD_SAMPLE_TYPES`, `SD_CONTAINER_SIZES`, `SD_STORAGE_TEMPS`, `SD_SAMPLE_TYPE_CONTAINERS`, `SD_STORAGE_RATES`, `SD_FIXED_RATES`
- `src/calculate.js`
	- `calculateStorage({ containerSize, storageTemp, storageDuration, totalSamples })`
	- `calculateDisposal({ totalSamples })`
	- `calculateStoreAndDispose(storeInputs, disposeInputs)`

### Regional & Expedite Modifier Additions

- `src/constants.js`
	- `REGIONS` — array of `{ key, label, factors: { K, L, T, S, D } }` for `us` (baseline, all 1.0), `eu`, `apac`, `latam`
	- `EXPEDITE_TIERS` — `{ standard, expedited, critical }`, each `{ label, shipping, testing, reporting }` surcharge percentages
- `src/calculate.js`
	- `getRegionFactors(regionKey)` — base preset factors for a region key (neutral 1.0 fallback for unknown/absent region)
	- `getEffectiveRegionFactors(inputs)` — layers optional per-category fine-tune overrides (`region_factor_K/L/T/S/D`) on top of the region preset; `null` means "not customized" and falls back to the preset
	- `getExpediteSurcharges(inputs)` — shipping/testing/reporting surcharge fractions, all zero when `expedite_enabled` is false
- `src/components/RegionPanel.jsx`, `src/components/ExpeditePanel.jsx` — selector plus collapsible fine-tune controls, used in both `CalculatorView` and `ScenariosView`

### Tiered Assays Pivot Point Additions

- `src/constants.js`
	- `TIERED_DEFAULTS` — seed values for the tab's local state (intentionally not part of `STARTUP_DEFAULTS`, since this tab is decoupled from the cost model)
	- `TIERED_TIER_LABELS` — display labels for Screen/Confirm/Titer
- `src/calculate.js`
	- `calculateTieredAssay(params)` — cascade counts, tiered vs. flat per-sample and total cost, pivot rate/kind, recommendation, turnaround comparison
	- `buildPivotSeries(params, steps = 101)` — per-sample cost curve across 0–100% screen positivity, used to render the crossover chart
- `src/components/TieredAssaysConfigPanel.jsx`, `src/components/PivotChart.jsx`, `src/views/TieredAssaysView.jsx`

### Export & Custom Preset Additions

- `src/export/download.js`, `exportModel.js`, `excelExport.js`, `imageExport.js`
- `src/presets/customPresets.js`
- `src/components/ExportToolbar.jsx` — renders Export to Excel / Save as Image / (optionally) Save as Preset in each view's header
