import { describe, expect, test } from 'vitest';
import { calculate, getExpediteSurcharges } from './calculate.js';

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

describe('getExpediteSurcharges', () => {
  test('returns all-zero fractions when disabled', () => {
    expect(getExpediteSurcharges({ expedite_enabled: false })).toEqual({ shipping: 0, testing: 0, reporting: 0 });
  });

  test('returns correct fractions when enabled', () => {
    expect(
      getExpediteSurcharges({
        expedite_enabled: true,
        expedite_shipping_pct: 40,
        expedite_testing_pct: 25,
        expedite_reporting_pct: 15,
      })
    ).toEqual({ shipping: 0.4, testing: 0.25, reporting: 0.15 });
  });
});

describe('calculate() with expedite surcharges', () => {
  test('shipping surcharge affects only the freight portion of L, not accessioning', () => {
    const baseline = calculate(makeInputs());
    const expedited = calculate(
      makeInputs({ expedite_enabled: true, expedite_shipping_pct: 40, expedite_testing_pct: 0, expedite_reporting_pct: 0 })
    );

    // L = (L_ship/samplesPerShipment)*N_shipments*(1+shipping) + L_accession
    const freight = (120 / 10) * 1;
    const expectedL = freight * 1.4 + 6;
    expect(expedited.L).toBeCloseTo(expectedL, 6);
    expect(expedited.K).toBeCloseTo(baseline.K, 6);
    expect(expedited.S).toBeCloseTo(baseline.S, 6);
    expect(expedited.D).toBeCloseTo(baseline.D, 6);
  });

  test('testing surcharge affects T_process + T_test but not T_data', () => {
    const expedited = calculate(
      makeInputs({ expedite_enabled: true, expedite_shipping_pct: 0, expedite_testing_pct: 25, expedite_reporting_pct: 0 })
    );

    const T_data = 5000 / 2000; // 2.5 (N_samples = 100*5*2*2 = 2000)
    const T_lab = (12 + 80) * 1.25; // 115
    expect(expedited.T).toBeCloseTo(T_lab + T_data, 6);
  });

  test('reporting surcharge affects only T_data', () => {
    const expedited = calculate(
      makeInputs({ expedite_enabled: true, expedite_shipping_pct: 0, expedite_testing_pct: 0, expedite_reporting_pct: 15 })
    );

    const T_data = (5000 / 2000) * 1.15; // 2.875
    const T_lab = 12 + 80; // 92
    expect(expedited.T).toBeCloseTo(T_lab + T_data, 6);
  });

  test('expedite_enabled: false reproduces baseline exactly regardless of stale pct fields', () => {
    const baseline = calculate(makeInputs());
    const disabledWithStalePcts = calculate(
      makeInputs({ expedite_enabled: false, expedite_shipping_pct: 80, expedite_testing_pct: 50, expedite_reporting_pct: 30 })
    );

    expect(disabledWithStalePcts).toEqual(baseline);
  });
});
