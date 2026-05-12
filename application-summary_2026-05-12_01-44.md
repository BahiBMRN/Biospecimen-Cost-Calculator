# Application Technical Summary

Generated: 2026-05-12 01:44 UTC

## 1. Application Overview
- Application name: B$LCC (Biospecimen Study Lifetime Cost Calculator)
- High-level purpose: Browser-based study cost modeling tool for biospecimen workflows, designed to estimate cost per sample and total study cost from configurable operational and financial levers.
- Intended users/stakeholders: Clinical operations teams, biospecimen program leads, study finance/planning stakeholders, and sponsor-side scenario modelers.

## 2. Core Functionality
- Key features and workflows:
- Calculator workflow with real-time formula-driven outputs across volume, kitting/site, logistics, testing, storage, and disposal inputs.
- Scenario lock-in workflow: Lock from Calculator captures a baseline, initializes scenario state from baseline, and routes users to What-If Scenarios.
- What-If workflow now uses separate state domains:
- calculator inputs
- locked baseline inputs
- scenario inputs
- active scenario selection/reset state
- Scenario application overlays preset values onto the locked baseline (not mutable calculator state).
- Reset restores scenario values back to the locked baseline and clears scenario selection.
- What-If input controls are intentionally read-only for data entry; guidance is shown via native input tooltips.
- Scenario comparison presentation:
- Locked Baseline card
- Scenario Assumptions panel
- Scenario Output card
- Right sidebar currently shows a placeholder Scenario Difference View panel pending redesign.
- Major modules/components and responsibilities:
- App: Central state orchestration, tab routing, workflow control, scenario mechanics.
- calculate(): Deterministic cost engine for per-sample and total cost metrics.
- CostComposition: Per-sample cost card with donut distribution and key metrics.
- BreakdownChart: Calculator-side component cost breakdown chart.
- DeltaComparisonChart: Placeholder component for future diff visualization.
- NumberControl: Shared numeric/range input control with lock behavior.
- AssumptionsCaveats: Calculator assumptions/caveats content block.
- External integrations/APIs/services:
- None identified. No backend/API calls detected; app is client-only.

## 3. Technical Architecture
- Tech stack:
- React 18 + Vite 6 + Recharts 3
- JavaScript/JSX (no TypeScript)
- CSS-based theming/layout (single app-level stylesheet)
- Vitest + Testing Library + jsdom
- Runtime environment and deployment model:
- Browser SPA, built with Vite, suitable for static hosting.
- Local development runs on Vite dev server (port 3000).
- Data stores and messaging:
- No persistent datastore, queue, or message bus.
- In-memory React state only; state resets on reload.

## 4. Current State
- Codebase maturity:
- MVP+/early production-shaping frontend. Product workflow is coherent and feature-rich for a single-page modeler, but still concentrated in a monolithic App component.
- Code quality observations:
- Strong configuration-driven model (CONFIG, presets, labels, metadata constants).
- Scenario architecture was refactored toward clearer state separation and safer baseline comparison behavior.
- Styling is extensive and intentionally tuned for scenario UX cues (lock/reset/buttons/cards/accordion patterns).
- Observed risk: isScenarioLocked state is set during lock flow but not consumed for rendering/logic decisions.
- Test coverage and reliability indicators:
- Existing tests target heading render, lock-and-navigate, read-only behavior, and reset behavior.
- Current run status in this workspace: 1 passed, 3 failed (4 total).
- Failures appear to be expectation drift after recent UX/text/workflow updates (selector text/assertion mismatch), not runtime crash of the app.
- Known technical debt or risks:
- Large single-file App implementation increases maintenance risk as feature set grows.
- Placeholder diff visualization on scenarios right sidebar indicates incomplete comparison capability.
- PWA manifest still uses generic Create React App naming values.

## 5. Recent Updates
- Source of evidence:
- Live code state in App.jsx, App.css, App.test.jsx
- Commit timeline:
- 2026-05-12: chore: mark current stable version
- 2026-05-12: chore: minor stable follow-up update
- 2026-04-29: V1.0 React conversion from SPA HTML
- Summary of recent change areas (implemented in current code):
- Scenario lock-in button workflow from Calculator to What-If.
- Refactored scenario/baseline/calculator state model and reset semantics.
- Read-only What-If controls with native input-level tooltip guidance.
- Left sidebar restructuring in scenarios mode:
- Scenario buttons panel
- Study Levers accordion (moved from middle column)
- Sample Levers accordion wrapper and grouped lever accordions
- Middle column restructuring in scenarios mode:
- Locked Baseline card
- Scenario Assumptions condensed panel
- Scenario Output card
- Right sidebar now a full-height placeholder panel for upcoming scenario difference redesign.
- Visual consistency updates including warm lock-button styling aligned with Scenario Output treatment.

## 6. Roadmap (If Discernible)
- Explicitly visible/planned:
- Scenario Difference View redesign is pending (placeholder text in current UI).
- Store or Dispose tab remains marked as coming soon.
- Inferred roadmap items (inference):
- Reintroduce a richer scenario-vs-baseline diff chart after redesign.
- Update tests to align with new scenario UI copy and structure.
- Potential component extraction from App to reduce coupling and improve testability.

## 7. Notable Observations
- Strengths:
- Clear domain-oriented calculator with immediate visual feedback and strong scenario modeling UX direction.
- Better comparison integrity after baseline lock and overlay refactor.
- Good use of reusable controls and configuration constants for maintainability of business parameters.
- Gaps/ambiguities needing clarification:
- Scenario Difference View is currently non-functional placeholder content.
- "Stable" commit messages are operational but low-context for future auditability.
- Test suite currently out of sync with UI changes, reducing CI confidence until updated.
- Recommendations:
- Prioritize test suite refresh to restore reliability signal after UX copy/layout changes.
- Complete scenario difference visualization redesign or feature-flag placeholder state explicitly.
- Split App into feature modules (state/model, layout sections, charts, controls) to reduce regression risk as scenario capabilities expand.
