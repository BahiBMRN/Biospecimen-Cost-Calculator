# Biospecimen Study Lifetime Cost Calculator (B$LCC)

B$LCC is an interactive browser application for modeling biospecimen study cost across the full lifecycle. Users adjust operational and financial levers, then review per-sample and total-study impact in real time.

## Application Summary

- Name: B$LCC (Biospecimen Study Lifetime Cost Calculator)
- Package: `codespaces-react`
- Primary use case: Modeling costs of clinical biospecimen collections individually and through the life of the study
- Primary users: clinical operations, biospecimen program leads, and study planning/finance stakeholders

## What the App Does

The model computes:

1. Per-sample cost (`C_sample`)
2. Total study cost (`TRUE_COST`)
3. Total sample volume (`N_samples`)
4. Total shipments required
5. Cost component values for K, L, T, S, and D

Cost formulas:

- `N_samples = N_subjects * N_visits * N_timepoints * N_aliquots`
- `C_sample = K + L + T + S + D`
- `TRUE_COST = C_sample * N_samples`

Input model includes 20 configurable levers grouped by:

- Volume
- Kitting & Site
- Logistics
- Testing
- Storage
- Disposal

## Product Workflow

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

- Present as a placeholder module marked "Soon".

## Technical Stack and Setup

### Stack

- React 18
- Vite 6
- Recharts 3
- JavaScript/JSX (no TypeScript)
- Vitest, Testing Library, jsdom

### Architecture Notes

- Client-side SPA with static build output
- No backend or external API integrations
- In-memory React state only (`calculatorInputs`, `lockedInputs`, `scenarioInputs`, `activeScenario`)
- No persistence layer (no database, queue, or local storage) [Coming Later]

## Quality and Current State

- Current maturity: advanced MVP with robust scenario workflow
- Automated tests: scenario and delta behaviors are covered
- Implementation concentration: primary model and UI logic are currently centralized in one main component

## Code Locations

- `src/App.jsx`: model formulas, scenario logic, and application flow
- `src/App.css`: layout, theming, and component styling
- `src/App.test.jsx`: behavior tests for calculator, scenarios, and edge cases