import { describe, expect, test } from 'vitest';
import { calculate, getEffectiveRegionFactors, getRegionFactors } from './calculate.js';

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

describe('getRegionFactors', () => {
  test('returns all-1.0 factors for "us"', () => {
    expect(getRegionFactors('us')).toEqual({ K: 1, L: 1, T: 1, S: 1, D: 1 });
  });

  test('returns all-1.0 factors for undefined/unknown region', () => {
    expect(getRegionFactors(undefined)).toEqual({ K: 1, L: 1, T: 1, S: 1, D: 1 });
    expect(getRegionFactors('not-a-real-region')).toEqual({ K: 1, L: 1, T: 1, S: 1, D: 1 });
  });

  test('returns configured factors for "eu"', () => {
    expect(getRegionFactors('eu')).toEqual({ K: 1.05, L: 1.15, T: 1.10, S: 1.08, D: 1.05 });
  });
});

describe('getEffectiveRegionFactors', () => {
  test('falls back to the region preset when factor overrides are entirely absent', () => {
    expect(getEffectiveRegionFactors({ region: 'eu' })).toEqual({ K: 1.05, L: 1.15, T: 1.10, S: 1.08, D: 1.05 });
  });

  test('falls back to the region preset when factor overrides are explicitly null', () => {
    expect(
      getEffectiveRegionFactors({
        region: 'apac',
        region_factor_K: null,
        region_factor_L: null,
        region_factor_T: null,
        region_factor_S: null,
        region_factor_D: null,
      })
    ).toEqual({ K: 0.90, L: 1.25, T: 0.85, S: 0.95, D: 0.90 });
  });

  test('honors a single fine-tuned override while other categories keep tracking the region preset', () => {
    const result = getEffectiveRegionFactors({
      region: 'eu',
      region_factor_L: 2, // only Logistics fine-tuned
      region_factor_K: null,
      region_factor_T: null,
      region_factor_S: null,
      region_factor_D: null,
    });

    expect(result).toEqual({ K: 1.05, L: 2, T: 1.10, S: 1.08, D: 1.05 });
  });

  test('honors an explicit override of exactly 0 (does not fall back to the preset)', () => {
    const result = getEffectiveRegionFactors({ region: 'eu', region_factor_K: 0 });
    expect(result.K).toBe(0);
  });

  test('switching region (via null overrides) reproduces the plain getRegionFactors lookup', () => {
    const inputs = {
      region: 'latam',
      region_factor_K: null,
      region_factor_L: null,
      region_factor_T: null,
      region_factor_S: null,
      region_factor_D: null,
    };
    expect(getEffectiveRegionFactors(inputs)).toEqual(getRegionFactors('latam'));
  });
});

describe('calculate() with regional multipliers', () => {
  test('eu region scales each category and TRUE_COST accordingly', () => {
    const us = calculate(makeInputs({ region: 'us' }));
    const eu = calculate(makeInputs({ region: 'eu' }));

    expect(eu.K).toBeCloseTo(us.K * 1.05, 6);
    expect(eu.L).toBeCloseTo(us.L * 1.15, 6);
    expect(eu.T).toBeCloseTo(us.T * 1.10, 6);
    expect(eu.S).toBeCloseTo(us.S * 1.08, 6);
    expect(eu.D).toBeCloseTo(us.D * 1.05, 6);
    expect(eu.C_sample).toBeCloseTo(eu.K + eu.L + eu.T + eu.S + eu.D, 6);
    expect(eu.TRUE_COST).toBeCloseTo(eu.C_sample * eu.N_samples, 6);
  });

  test('region does not change N_samples or totalShipmentsRequired', () => {
    const us = calculate(makeInputs({ region: 'us' }));
    const apac = calculate(makeInputs({ region: 'apac' }));

    expect(apac.N_samples).toBe(us.N_samples);
    expect(apac.totalShipmentsRequired).toBe(us.totalShipmentsRequired);
  });

  test('a fine-tuned region_factor override changes only that category, overriding the preset', () => {
    const us = calculate(makeInputs({ region: 'us' }));
    const customized = calculate(makeInputs({ region: 'us', region_factor_K: 2 }));

    expect(customized.K).toBeCloseTo(us.K * 2, 6);
    expect(customized.L).toBeCloseTo(us.L, 6);
    expect(customized.T).toBeCloseTo(us.T, 6);
    expect(customized.S).toBeCloseTo(us.S, 6);
    expect(customized.D).toBeCloseTo(us.D, 6);
  });
});
