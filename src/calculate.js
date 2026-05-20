import { COLORS, SD_FIXED_RATES, SD_STORAGE_RATES } from './constants.js';
import { ceilDiv } from './utils.js';

export function calculate(inputs) {
  const N_samples = Number(inputs.N_subjects) * Number(inputs.N_visits) * Number(inputs.N_timepoints) * Number(inputs.N_aliquots);

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

  const samplesPerShipment = Number(inputs.N_samples_ship) > 0 ? Number(inputs.N_samples_ship) : 1;
  const K = Number(inputs.K_kit) + Number(inputs.K_site) + Number(inputs.K_special);
  const L = (Number(inputs.L_ship) / samplesPerShipment) * Number(inputs.N_shipments) + Number(inputs.L_accession);
  const T_data = Number(inputs.T_data_total) / N_samples;
  const T = Number(inputs.T_process) + Number(inputs.T_test) + T_data;
  const S = Number(inputs.S_setup) + Number(inputs.S_rate) * Number(inputs.S_duration);
  const D = Number(inputs.D_retrieve) + Number(inputs.D_destroy) + Number(inputs.D_doc);
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
