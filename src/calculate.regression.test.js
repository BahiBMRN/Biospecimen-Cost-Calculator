import { describe, expect, test } from 'vitest';
import { calculate } from './calculate.js';

function makeInputs(overrides = {}) {
  return {
    N_participants: 100,
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

describe('Regression: calculate() unaffected by new modifiers at neutral defaults', () => {
  test('matches documented baseline output with no region/expedite fields present', () => {
    const result = calculate(makeInputs());

    expect(result.N_samples).toBe(2000); // 100*5*2*2
    expect(result.K).toBeCloseTo(40, 6);
    expect(result.L).toBeCloseTo(18, 6); // (120/10)*1 + 6
    expect(result.T).toBeCloseTo(94.5, 6); // 12 + 80 + 5000/2000
    expect(result.S).toBeCloseTo(5, 6);
    expect(result.D).toBeCloseTo(10, 6);
    expect(result.C_sample).toBeCloseTo(167.5, 6);
    expect(result.TRUE_COST).toBeCloseTo(335000, 6);
  });

  test('zero samples-per-shipment case still yields L = 205 (unchanged from pre-existing suite)', () => {
    const result = calculate(
      makeInputs({
        N_participants: 1,
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

    expect(result.L).toBe(205);
  });

  test('region: "us" (explicit) produces identical output to omitting region entirely', () => {
    const withoutRegion = calculate(makeInputs());
    const withUsRegion = calculate(makeInputs({ region: 'us' }));

    expect(withUsRegion).toEqual(withoutRegion);
  });

  test('expedite_enabled: false (explicit) produces identical output to omitting expedite fields entirely', () => {
    const withoutExpedite = calculate(makeInputs());
    const withExpediteDisabled = calculate(
      makeInputs({
        expedite_enabled: false,
        expedite_shipping_pct: 0,
        expedite_testing_pct: 0,
        expedite_reporting_pct: 0,
      })
    );

    expect(withExpediteDisabled).toEqual(withoutExpedite);
  });

  test('calculate() output does not depend on any Tiered Assays tab value (no coupling)', () => {
    const baseline = calculate(makeInputs());
    const withTieredFieldsPresent = calculate(
      makeInputs({
        screenCost: 15,
        confirmCost: 120,
        titerCost: 180,
        screenTat: 3,
        confirmTat: 7,
        titerTat: 10,
        confirmPosPct: 60,
        currentScreenPosPct: 15,
        flatAssayCost: 999999,
        flatTat: 12,
        totalSamples: 5000,
      })
    );

    expect(withTieredFieldsPresent).toEqual(baseline);
  });
});
