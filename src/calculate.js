import { COLORS, REGIONS, SD_FIXED_RATES, SD_STORAGE_RATES } from './constants.js';
import { ceilDiv, clamp } from './utils.js';

const NEUTRAL_FACTORS = { K: 1, L: 1, T: 1, S: 1, D: 1 };

// Returns per-category multipliers for a region key. Unknown/absent region
// resolves to all-1.0 so callers are always safe to multiply by the result.
export function getRegionFactors(regionKey) {
  const region = REGIONS.find((r) => r.key === regionKey);
  return region ? region.factors : NEUTRAL_FACTORS;
}

function resolveFactor(overrideValue, baseValue) {
  if (overrideValue == null) {
    return baseValue;
  }
  const parsed = Number(overrideValue);
  return Number.isNaN(parsed) ? baseValue : parsed;
}

// Layers optional per-category fine-tune overrides (region_factor_K/L/T/S/D)
// on top of the selected region's preset factors. Overrides of exactly 0 are
// honored (a user may deliberately zero out a category); only a genuinely
// absent/non-numeric field falls back to the region preset.
export function getEffectiveRegionFactors(inputs) {
  const base = getRegionFactors(inputs.region);
  return {
    K: resolveFactor(inputs.region_factor_K, base.K),
    L: resolveFactor(inputs.region_factor_L, base.L),
    T: resolveFactor(inputs.region_factor_T, base.T),
    S: resolveFactor(inputs.region_factor_S, base.S),
    D: resolveFactor(inputs.region_factor_D, base.D),
  };
}

// Returns shipping/testing/reporting surcharge fractions (e.g. 0.4 for 40%).
// Disabled (or absent) expedite resolves to all-zero fractions.
export function getExpediteSurcharges(inputs) {
  if (!inputs.expedite_enabled) {
    return { shipping: 0, testing: 0, reporting: 0 };
  }

  return {
    shipping: (Number(inputs.expedite_shipping_pct) || 0) / 100,
    testing: (Number(inputs.expedite_testing_pct) || 0) / 100,
    reporting: (Number(inputs.expedite_reporting_pct) || 0) / 100,
  };
}

export function calculate(inputs) {
  const N_samples = Number(inputs.N_participants) * Number(inputs.N_visits) * Number(inputs.N_timepoints) * Number(inputs.N_aliquots);

  if (N_samples <= 0) {
    const segments = [
      { label: 'Kitting & Site', value: 0, color: COLORS[0] },
      { label: 'Logistics', value: 0, color: COLORS[1] },
      { label: 'Testing', value: 0, color: COLORS[2] },
      { label: 'Storage', value: 0, color: COLORS[3] },
      { label: 'Disposal', value: 0, color: COLORS[4] },
    ];

    return {
      C_sample: 0,
      TRUE_COST: 0,
      N_samples: 0,
      totalShipmentsRequired: 0,
      segments,
      K: 0,
      L: 0,
      T: 0,
      S: 0,
      D: 0,
    };
  }

  const factors = getEffectiveRegionFactors(inputs);
  const exp = getExpediteSurcharges(inputs);
  const samplesPerShipment = Number(inputs.N_samples_ship) > 0 ? Number(inputs.N_samples_ship) : 1;

  const K_raw = Number(inputs.K_kit) + Number(inputs.K_site) + Number(inputs.K_special);

  const L_freight = (Number(inputs.L_ship) / samplesPerShipment) * Number(inputs.N_shipments);
  const L_raw = L_freight * (1 + exp.shipping) + Number(inputs.L_accession);

  const assay = Number(inputs.T_test) || 0;
  const T_lab = (Number(inputs.T_process) + assay) * (1 + exp.testing);
  const T_data = (Number(inputs.T_data_total) / N_samples) * (1 + exp.reporting);
  const T_raw = T_lab + T_data;

  const S_raw = Number(inputs.S_setup) + Number(inputs.S_rate) * Number(inputs.S_duration);
  const D_raw = Number(inputs.D_retrieve) + Number(inputs.D_destroy) + Number(inputs.D_doc);

  const K = K_raw * factors.K;
  const L = L_raw * factors.L;
  const T = T_raw * factors.T;
  const S = S_raw * factors.S;
  const D = D_raw * factors.D;

  const C_sample = K + L + T + S + D;
  const TRUE_COST = C_sample * N_samples;
  const totalShipmentsRequired = ceilDiv(N_samples, samplesPerShipment) * Number(inputs.N_shipments);
  const segments = [
    { label: 'Kitting & Site', value: K, color: COLORS[0] },
    { label: 'Logistics', value: L, color: COLORS[1] },
    { label: 'Testing', value: T, color: COLORS[2] },
    { label: 'Storage', value: S, color: COLORS[3] },
    { label: 'Disposal', value: D, color: COLORS[4] },
  ];

  return { C_sample, TRUE_COST, N_samples, totalShipmentsRequired, segments, K, L, T, S, D };
}

// ── Store & Dispose Calculation Functions ────────────────────────────────────

/**
 * Calculate storage cost per sample and optional total study cost.
 * @param {{ containerSize: string|null, storageTemp: string|null, storageDuration: number, totalSamples: string|number }} inputs
 * @returns {{ perSample: number|null, totalStudy: number|null, storageRate: number|null }}
 */
export function calculateStorage({ containerSize, storageTemp, storageDuration, totalSamples }) {
  if (!containerSize || !storageTemp) {
    return { perSample: null, totalStudy: null, storageRate: null };
  }

  const rateRow = SD_STORAGE_RATES[containerSize];
  const storageRate = rateRow ? rateRow[storageTemp] : null;

  if (storageRate == null) {
    return { perSample: null, totalStudy: null, storageRate: null };
  }

  const duration = Number(storageDuration) || 0;
  const perSample = SD_FIXED_RATES.registration + storageRate * duration;
  const n = Number(totalSamples);
  const totalStudy = n > 0 ? perSample * n : null;

  return { perSample, totalStudy, storageRate };
}

/**
 * Calculate disposal cost per sample and optional total study cost.
 * Disposal rates are fixed regardless of container size.
 * @param {{ totalSamples: string|number }} inputs
 * @returns {{ perSample: number, totalStudy: number|null }}
 */
export function calculateDisposal({ totalSamples }) {
  const perSample = SD_FIXED_RATES.registration + SD_FIXED_RATES.disposal;
  const n = Number(totalSamples);
  const totalStudy = n > 0 ? perSample * n : null;
  return { perSample, totalStudy };
}

/**
 * Calculate combined store & dispose cost.
 * Registration applies once (at storage); Retrieval applies for disposal.
 * @param {{ containerSize: string|null, storageTemp: string|null, storageDuration: number, totalSamples: string|number }} storeInputs
 * @param {{ totalSamples: string|number }} disposeInputs
 * @returns {{ perSample: number|null, totalStudy: number|null, storagePortion: number|null, disposalPortion: number }}
 */
export function calculateStoreAndDispose(storeInputs, disposeInputs) {
  const { containerSize, storageTemp, storageDuration } = storeInputs;

  if (!containerSize || !storageTemp) {
    return { perSample: null, totalStudy: null, storagePortion: null, disposalPortion: null };
  }

  const rateRow = SD_STORAGE_RATES[containerSize];
  const storageRate = rateRow ? rateRow[storageTemp] : null;

  if (storageRate == null) {
    return { perSample: null, totalStudy: null, storagePortion: null, disposalPortion: null };
  }

  const duration = Number(storageDuration) || 0;
  // Registration applied once at storage receipt
  const storagePortion = SD_FIXED_RATES.registration + storageRate * duration;
  // Retrieval + Disposal for disposal (no double-registration)
  const disposalPortion = SD_FIXED_RATES.retrieval + SD_FIXED_RATES.disposal;
  const perSample = storagePortion + disposalPortion;

  const n = Number(storeInputs.totalSamples) || Number(disposeInputs.totalSamples) || 0;
  const totalStudy = n > 0 ? perSample * n : null;

  return { perSample, totalStudy, storagePortion, disposalPortion, storageRate };
}

// ── Tiered Assays Pivot Point (standalone tab; no coupling to calculate()) ──

/**
 * Compare a 3-tier cascade (screen -> confirm -> titer) against a single flat
 * assay, and compute the break-even ("pivot") screen-positivity rate.
 * @param {{
 *   screenCost:number, confirmCost:number, titerCost:number,
 *   screenTat:number, confirmTat:number, titerTat:number,
 *   screenPosPct:number, confirmPosPct:number,
 *   flatAssayCost:number, flatTat:number,
 *   totalSamples:string|number
 * }} params
 */
export function calculateTieredAssay(params) {
  const {
    screenCost, confirmCost, titerCost,
    screenTat, confirmTat, titerTat,
    screenPosPct, confirmPosPct,
    flatAssayCost, flatTat,
    totalSamples,
  } = params;

  const sc = Number(screenCost) || 0;
  const cc = Number(confirmCost) || 0;
  const tc = Number(titerCost) || 0;
  const sTat = Number(screenTat) || 0;
  const cTat = Number(confirmTat) || 0;
  const tTat = Number(titerTat) || 0;
  const flatCost = Number(flatAssayCost) || 0;
  const flatTatValue = Number(flatTat) || 0;

  const p = clamp(Number(screenPosPct) || 0, 0, 100) / 100;
  const q = clamp(Number(confirmPosPct) || 0, 0, 100) / 100;

  const tieredPerSample = sc + p * cc + p * q * tc;
  const flatPerSample = flatCost;

  const denom = cc + q * tc;

  let pivotRate;
  let pivotKind;
  let recommendation;

  if (denom <= 0) {
    pivotKind = 'no-downstream';
    pivotRate = null;
    if (sc < flatCost) {
      recommendation = 'tiered';
    } else if (sc > flatCost) {
      recommendation = 'flat';
    } else {
      recommendation = 'equal';
    }
  } else {
    const pStar = (flatCost - sc) / denom;
    if (pStar < 0) {
      pivotKind = 'flat-always';
      pivotRate = 0;
      recommendation = 'flat';
    } else if (pStar > 1) {
      pivotKind = 'tiered-always';
      pivotRate = 100;
      recommendation = 'tiered';
    } else {
      pivotKind = 'normal';
      pivotRate = pStar * 100;
      const currentPct = p * 100;
      if (currentPct < pivotRate) {
        recommendation = 'tiered';
      } else if (currentPct > pivotRate) {
        recommendation = 'flat';
      } else {
        recommendation = 'equal';
      }
    }
  }

  const n = Number(totalSamples) || 0;
  let counts = null;
  let tieredTotal = null;
  let flatTotal = null;
  if (n > 0) {
    counts = {
      screened: n,
      screenPos: n * p,
      confirmPos: n * p * q,
      titered: n * p * q,
    };
    tieredTotal = tieredPerSample * n;
    flatTotal = flatPerSample * n;
  }

  const tieredTatWorst = sTat + cTat + tTat;
  const tatDelta = tieredTatWorst - flatTatValue;

  return {
    tieredPerSample,
    flatPerSample,
    denom,
    pivotRate,
    pivotKind,
    recommendation,
    counts,
    tieredTotal,
    flatTotal,
    tieredTatWorst,
    flatTatValue,
    tatDelta,
  };
}

/**
 * Builds the crossover series (tiered vs flat per-sample cost) swept across
 * screen positivity 0-100%, holding confirm positivity constant.
 * @param {{ screenCost:number, confirmCost:number, titerCost:number, confirmPosPct:number, flatAssayCost:number }} params
 * @param {number} [steps=101]
 */
export function buildPivotSeries(params, steps = 101) {
  const { screenCost, confirmCost, titerCost, confirmPosPct, flatAssayCost } = params;
  const sc = Number(screenCost) || 0;
  const cc = Number(confirmCost) || 0;
  const tc = Number(titerCost) || 0;
  const flatCost = Number(flatAssayCost) || 0;
  const q = clamp(Number(confirmPosPct) || 0, 0, 100) / 100;

  const series = [];
  const count = Math.max(2, steps);
  for (let i = 0; i < count; i += 1) {
    const positivity = (i / (count - 1)) * 100;
    const p = positivity / 100;
    series.push({
      positivity,
      tiered: sc + p * cc + p * q * tc,
      flat: flatCost,
    });
  }

  return series;
}
