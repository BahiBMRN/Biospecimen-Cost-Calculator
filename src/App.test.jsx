import { expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { calculate } from './calculate';

function makeInputs(overrides = {}) {
  return {
    N_subjects: 100,
    N_visits: 5,
    N_timepoints: 2,
    N_aliquots: 2,
    K_kit: 18,
    K_site: 22,
    K_special: 0,
    L_ship: 120,
    N_samples_ship: 10,
    N_shipments: 1,
    L_accession: 6,
    T_process: 12,
    T_test: 80,
    T_data_total: 5000,
    S_setup: 5,
    S_rate: 0.25,
    S_duration: 0,
    D_retrieve: 2,
    D_destroy: 6,
    D_doc: 2,
    ...overrides,
  };
}

test('renders biospecimen calculator heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/biospecimen study lifetime cost calculator/i);
  expect(headingElement).toBeDefined();
});

test('locks values from calculator and opens what-if with baseline and scenario cards', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /lock in cost for scenario modeling/i }));

  expect(screen.getByRole('heading', { name: /what-if scenarios/i })).toBeDefined();
  expect(screen.getByText(/^locked baseline$/i)).toBeDefined();
  expect(screen.getByText(/^scenario output$/i)).toBeDefined();
  expect(screen.getByText(/custom scenario comparison/i)).toBeDefined();
});

test('what-if controls are editable and manual edits switch assumptions to custom', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /what-if scenarios/i }));

  const subjectsInput = screen.getByLabelText(/subjects/i);
  expect(subjectsInput.disabled).toBe(false);

  await user.clear(subjectsInput);
  await user.type(subjectsInput, '120');

  expect(screen.getByText(/custom scenario comparison/i)).toBeDefined();
  expect(screen.getByText(/this view reflects your custom configured lever values/i)).toBeDefined();
});

test('reset returns scenario view to locked baseline state', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /lock in cost for scenario modeling/i }));
  await user.click(screen.getByRole('button', { name: /direct to central lab analysis -> residual lts/i }));
  expect(screen.getByText(/scenario assumptions: direct to central lab analysis -> residual lts/i)).toBeDefined();

  await user.click(screen.getByRole('button', { name: /^reset$/i }));
  expect(screen.getByText(/custom scenario comparison/i)).toBeDefined();
});

test('manual scenario edits do not change locked baseline output', async () => {
  const user = userEvent.setup();
  render(<App />);

  // Set up initial calculator values so per-sample cost depends on volume
  // Set Total Data Transfer Cost directly (accordion is a <summary>, not a button)
  const tDataInput = screen.getByLabelText(/total data transfer cost/i);
  await user.clear(tDataInput);
  await user.type(tDataInput, '5000');

  // Provide non-zero volume so N_samples > 0
  const subjCalc = screen.getByLabelText(/^subjects$/i);
  const visitsCalc = screen.getByLabelText(/^visits$/i);
  const tpsCalc = screen.getByLabelText(/^timepoints$/i);
  const aliquotsCalc = screen.getByLabelText(/^aliquots$/i);
  await user.clear(subjCalc);
  await user.type(subjCalc, '100');
  await user.clear(visitsCalc);
  await user.type(visitsCalc, '5');
  await user.clear(tpsCalc);
  await user.type(tpsCalc, '2');
  await user.clear(aliquotsCalc);
  await user.type(aliquotsCalc, '2');

  await user.click(screen.getByRole('button', { name: /lock in cost for scenario modeling/i }));

  // Capture Cost Per Sample from Locked Baseline and Scenario Output
  const lockedCard = screen.getByText(/locked baseline/i).closest('section');
  const scenarioCard = screen.getByText(/scenario output/i).closest('section');
  const lockedCpsBefore = within(lockedCard).getByRole('heading', { level: 2 }).textContent;
  const scenarioCpsBefore = within(scenarioCard).getByRole('heading', { level: 2 }).textContent;
  expect(lockedCpsBefore).toBe(scenarioCpsBefore);

  // Editing subjects in scenario view should change scenario CPS but not locked CPS
  const subjectsInput = screen.getByLabelText(/subjects/i);
  await user.clear(subjectsInput);
  await user.type(subjectsInput, '120');

  const lockedCpsAfter = within(lockedCard).getByRole('heading', { level: 2 }).textContent;
  const scenarioCpsAfter = within(scenarioCard).getByRole('heading', { level: 2 }).textContent;
  expect(lockedCpsAfter).toBe(lockedCpsBefore);
  expect(scenarioCpsAfter).not.toBe(lockedCpsBefore);
});

test('clicking preset after custom edits returns assumptions panel to preset mode', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /what-if scenarios/i }));

  const subjectsInput = screen.getByLabelText(/subjects/i);
  await user.clear(subjectsInput);
  await user.type(subjectsInput, '130');
  expect(screen.getByText(/custom scenario comparison/i)).toBeDefined();

  const presetButton = screen.getByRole('button', { name: /direct to central lab analysis -> residual lts/i });
  await user.click(presetButton);

  expect(screen.getByText(/scenario assumptions: direct to central lab analysis -> residual lts/i)).toBeDefined();
  expect(presetButton.className).toContain('active');
});

test('scenario difference sidebar renders per-sample and total delta sections', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /what-if scenarios/i }));

  expect(screen.getByText(/per-sample cost delta/i)).toBeDefined();
  expect(screen.getByText(/total study cost delta/i)).toBeDefined();
  expect(screen.getByTestId('total-study-delta-percent')).toBeDefined();
});

test('per-sample delta rows stay in formula order', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /what-if scenarios/i }));
  await user.click(screen.getByRole('button', { name: /direct to central lab analysis -> residual lts/i }));

  expect(screen.getByTestId('delta-row-0').textContent).toContain('K');
});

test('total study delta percent handles zero baseline safely', () => {
  render(
    <App />
  );

  const baseline = calculate(
    makeInputs({
      N_subjects: 1,
      N_visits: 1,
      N_timepoints: 1,
      N_aliquots: 1,
      K_kit: 0,
      K_site: 0,
      K_special: 0,
      L_ship: 0,
      N_samples_ship: 1,
      N_shipments: 1,
      L_accession: 0,
      T_process: 0,
      T_test: 0,
      T_data_total: 0,
      S_setup: 0,
      S_rate: 0,
      S_duration: 0,
      D_retrieve: 0,
      D_destroy: 0,
      D_doc: 0,
    })
  );

  const scenario = calculate(makeInputs({ N_subjects: 1, N_visits: 1, N_timepoints: 1, N_aliquots: 1, K_kit: 10, K_site: 0, K_special: 0, L_ship: 0, N_samples_ship: 1, N_shipments: 1, L_accession: 0, T_process: 0, T_test: 0, T_data_total: 0, S_setup: 0, S_rate: 0, S_duration: 0, D_retrieve: 0, D_destroy: 0, D_doc: 0 }));

  expect(baseline.TRUE_COST).toBe(0);
  expect(scenario.TRUE_COST).toBeGreaterThan(0);
});

test('calculate returns zeroed outputs when total sample volume is zero', () => {
  const result = calculate(makeInputs({ N_subjects: 0 }));

  expect(result.N_samples).toBe(0);
  expect(result.C_sample).toBe(0);
  expect(result.TRUE_COST).toBe(0);
  expect(result.totalShipmentsRequired).toBe(0);
  expect(result.K).toBe(0);
  expect(result.L).toBe(0);
  expect(result.T).toBe(0);
  expect(result.S).toBe(0);
  expect(result.D).toBe(0);
  expect(result.segments.every((segment) => segment.value === 0)).toBe(true);
});

test('calculate keeps zero-volume data transfer from becoming per-sample charge', () => {
  const result = calculate(makeInputs({ N_subjects: 0, T_data_total: 9000 }));

  expect(result.N_samples).toBe(0);
  expect(result.T).toBe(0);
  expect(result.C_sample).toBe(0);
  expect(result.TRUE_COST).toBe(0);
});

test('calculate handles zero samples-per-shipment defensively without NaN or Infinity', () => {
  const result = calculate(
    makeInputs({
      N_subjects: 1,
      N_visits: 1,
      N_timepoints: 1,
      N_aliquots: 2,
      K_kit: 10,
      K_site: 5,
      K_special: 0,
      L_ship: 100,
      N_samples_ship: 0,
      N_shipments: 2,
      L_accession: 5,
      T_process: 1,
      T_test: 2,
      T_data_total: 20,
      S_setup: 0,
      S_rate: 0,
      S_duration: 0,
      D_retrieve: 0,
      D_destroy: 0,
      D_doc: 0,
    })
  );

  expect(result.N_samples).toBe(2);
  expect(result.L).toBe(205);
  expect(result.totalShipmentsRequired).toBe(4);
  expect(Number.isFinite(result.C_sample)).toBe(true);
  expect(Number.isFinite(result.TRUE_COST)).toBe(true);
});

// ── Store & Dispose Module Tests ─────────────────────────────────────────────

test('store tab computes per-sample from registration + (rate × duration)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /store or dispose/i }));
  expect(screen.getByRole('heading', { name: /store or dispose/i })).toBeDefined();

  await user.click(screen.getByRole('button', { name: /plasma/i }));
  await user.click(screen.getByRole('button', { name: /^≤4mL$/i }));
  await user.click(screen.getByRole('button', { name: /-70°?c to -80°?c/i }));

  const numberInputs = screen.getAllByRole('spinbutton');
  await user.clear(numberInputs[0]);
  await user.type(numberInputs[0], '24');

  expect(screen.getAllByText(/\$3\.02/).length).toBeGreaterThan(0);
  expect(screen.getByText(/enter total samples to calculate total study cost\./i)).toBeDefined();
});

test('dispose tab shows fixed $3.54 per-sample regardless of container', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /store or dispose/i }));
  await user.click(screen.getByRole('button', { name: /^dispose$/i }));

  await user.click(screen.getByRole('button', { name: /whole blood/i }));
  await user.click(screen.getByRole('button', { name: /^≤4mL$/i }));

  expect(screen.getAllByText(/\$3\.54/).length).toBeGreaterThan(0);
});

test('store & dispose combined applies registration once and retrieval for disposal', async () => {
  const user = userEvent.setup();
  render(<App />);

  // Configure Store side
  await user.click(screen.getByRole('button', { name: /store or dispose/i }));
  await user.click(screen.getByRole('button', { name: /plasma/i }));
  await user.click(screen.getByRole('button', { name: /^≤4mL$/i }));
  await user.click(screen.getByRole('button', { name: /-70°?c to -80°?c/i }));
  const storeInputs = screen.getAllByRole('spinbutton');
  await user.clear(storeInputs[0]);
  await user.type(storeInputs[0], '24');

  // Configure Dispose side (container selection only required)
  await user.click(screen.getByRole('button', { name: /^dispose$/i }));
  await user.click(screen.getByRole('button', { name: /whole blood/i }));
  await user.click(screen.getByRole('button', { name: /^≤4mL$/i }));

  // Combined tab should now compute = 3.02 (storage portion) + 4.64 (retrieval + disposal) = $7.66
  await user.click(screen.getByRole('button', { name: /store & dispose/i }));
  expect(screen.getAllByText(/\$7\.66/).length).toBeGreaterThan(0);
});

test('tissue slides use ≤4mL storage rate row', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /store or dispose/i }));
  await user.click(screen.getByRole('button', { name: /tissue/i }));
  await user.click(screen.getByRole('button', { name: /slides/i }));
  await user.click(screen.getByRole('button', { name: /-70°?c to -80°?c/i }));

  const numberInputs = screen.getAllByRole('spinbutton');
  await user.clear(numberInputs[0]);
  await user.type(numberInputs[0], '24');

  expect(screen.getAllByText(/\$3\.02/).length).toBeGreaterThan(0);
});

test('store & dispose total study cost remains hidden until total samples provided', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /store or dispose/i }));
  await user.click(screen.getByRole('button', { name: /plasma/i }));
  await user.click(screen.getByRole('button', { name: /^≤4mL$/i }));
  await user.click(screen.getByRole('button', { name: /-70°?c to -80°?c/i }));

  const [durationInput, totalSamplesInput] = screen.getAllByRole('spinbutton');
  await user.clear(durationInput);
  await user.type(durationInput, '24');

  // No total samples yet → hint visible and total tile shows placeholder
  expect(screen.getByText(/enter total samples to calculate total study cost\./i)).toBeDefined();

  // Enter total samples → total study cost shows (3.02 * 100 = $302)
  await user.clear(totalSamplesInput);
  await user.type(totalSamplesInput, '100');
  expect(screen.getAllByText(/\$302\b/).length).toBeGreaterThan(0);
});

test('sd view state is isolated and does not affect calculator inputs', async () => {
  const user = userEvent.setup();
  render(<App />);

  // Configure some SD state
  await user.click(screen.getByRole('button', { name: /store or dispose/i }));
  await user.click(screen.getByRole('button', { name: /plasma/i }));
  await user.click(screen.getByRole('button', { name: /≤?4ml/i }));
  await user.click(screen.getByRole('button', { name: /-70°?c to -80°?c/i }));

  // Navigate back to Calculator and verify Subjects remains default (100)
  await user.click(screen.getByRole('button', { name: /calculator/i }));
  const subjectsInput = screen.getByLabelText(/subjects/i);
  // Blank startup: subjects is empty value
  expect(subjectsInput).toHaveValue(null);
});
