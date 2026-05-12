# Application Summary

## Application Overview
- Application name (fact): B$LCC (Biospecimen Study Lifetime Cost Calculator); package name is `codespaces-react`.
- Purpose (fact): Interactive browser-based cost modeling for biospecimen studies, calculating per-sample and total-study cost from configurable operational and financial levers.
- Primary users (inferred): Clinical operations, biospecimen program leads, and study finance/planning stakeholders evaluating protocol and logistics cost impact.

## Core Functionality
- Cost calculator (fact): Models 20 inputs across Volume, Kitting & Site, Logistics, Testing, Storage, and Disposal.
- Computation engine (fact): Deterministic formula pipeline computes:
  - `C_sample = K + L + T + S + D`
  - `TRUE_COST = C_sample × N_samples`
  - Shipment totals and per-component values.
- Scenario workflow (fact):
  - Users can lock calculator values as a baseline.
  - Scenario presets (`s1`-`s4`) overlay changes onto the locked baseline.
  - Manual lever edits are supported and switch to custom comparison mode.
  - Reset restores scenario state to locked baseline.
- Difference visualization (fact):
  - Scenario Difference View is implemented and active.
  - Includes per-sample delta rows for K/L/T/S/D and a total-study delta card with percent delta handling (including zero-baseline guard).
- User interface behavior (fact):
  - Dual-tab core flow (`Calculator`, `What-If Scenarios`) plus a placeholder `Store or Dispose` tab.
  - Accordion-based lever controls and chart-driven output (donut + bar + delta rails).
- External integrations (fact): None detected; no backend/API calls.

## Technical Architecture
- Stack (fact):
  - React 18, Vite 6, Recharts 3
  - JavaScript/JSX (no TypeScript)
  - Vitest + Testing Library + jsdom
- Runtime/deployment model (fact):
  - Client-side SPA, static-build deployable.
  - Dev server configured on port 3000.
- State/data model (fact):
  - In-memory React state only (`calculatorInputs`, `lockedInputs`, `scenarioInputs`, `activeScenario`).
  - No persistence layer (no DB, queue, or local storage).
- PWA posture (fact):
  - Manifest is present, but still uses generic template identity values.

## Current State
- Maturity (fact): Advanced MVP with a coherent user flow and domain-rich modeling; still monolithic in implementation footprint.
- Scenario editing status (fact):
  - Recently implemented behavior supports editable scenario levers after baseline lock.
  - Manual edits preserve locked-baseline output while changing scenario output.
  - Preset re-selection returns assumptions panel to preset mode.
- Difference visualization status (fact):
  - Active implementation exists (not placeholder), including signed currency/percent deltas and visual positive/negative tracks.
- Quality/reliability signals (fact):
  - Automated tests currently pass: 12/12.
  - Coverage includes lock workflow, scenario edit/reset behavior, baseline isolation, delta rendering/order, and core `calculate` edge cases.
  - Test stderr includes chart container sizing warnings in jsdom (noise, not failing).
- Code quality observations (fact):
  - Strong configuration-driven model with reusable controls.
  - Significant UI and business logic concentration in one component file increases future regression risk.
  - One state flag (`isScenarioLocked`) is set but not materially consumed in rendered behavior.
- Key risks/technical debt (fact):
  - Generic app metadata (title/manifest/description) not yet productized.
  - No persistence/export capabilities for scenario sharing or audit traceability.
  - No backend validation/service boundary.

## Recent Updates
- Recent commits (fact):
  - `2026-05-12`: “mark current stable version”
  - `2026-05-12`: “minor stable follow-up update”
  - `2026-04-29`: React V1.0 conversion from SPA HTML.
- Most active areas (fact):
  - Scenario architecture and UX flow.
  - Scenario assumptions panel behavior.
  - Difference visualization UI.
  - Expanded test suite focused on scenario and delta behavior.
- Local working tree activity (fact):
  - Ongoing edits in core UI/test files indicate active iteration on scenario and visualization behavior.

## Roadmap (If Discernible)
- Explicitly visible (fact):
  - `Store or Dispose` module is marked “Soon” and currently placeholder-only.
- Implied near-term work (inferred):
  - Decompose monolithic app into feature modules/components.
  - Harden chart rendering in tests to eliminate jsdom sizing warnings.
  - Add persistence/export (shareable scenarios, reporting outputs).
  - Productize metadata/branding and deployment readiness.

## Notable Observations
- Strengths (fact):
  - Clear domain model with immediate analytical feedback.
  - Scenario baseline/edit/reset semantics are now more robust and test-backed.
  - Difference visualization provides actionable comparison framing for decision-making.
- Gaps needing clarification (fact):
  - Intended production deployment target and operational ownership are not documented.
  - No explicit roadmap file or ADRs; planning intent is mostly inferred from UI and commit patterns.
- Recommendation (inferred):
  - Prioritize modularization plus persistence/export to move from advanced MVP toward production-grade planning tool.
