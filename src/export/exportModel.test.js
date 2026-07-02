import { describe, expect, test } from 'vitest';
import { calculate, calculateDisposal, calculateStorage, calculateStoreAndDispose, calculateTieredAssay } from '../calculate.js';
import { STARTUP_DEFAULTS } from '../constants.js';
import {
  buildCalculatorExportModel,
  buildScenarioExportModel,
  buildSdExportModel,
  buildTieredExportModel,
} from './exportModel.js';

describe('buildCalculatorExportModel', () => {
  const inputs = { ...STARTUP_DEFAULTS, N_participants: 10, K_kit: 100 };
  const result = calculate(inputs);
  const model = buildCalculatorExportModel(inputs, result);

  test('summaryRows reflects totals and top driver', () => {
    expect(model.summaryRows).toEqual([
      { label: 'Total Study Cost', value: '$1,000' },
      { label: 'Cost per Sample', value: '$100.00' },
      { label: 'Total Samples', value: '10' },
      { label: 'Total Shipments', value: '10' },
      { label: 'Top Driver', value: 'Kitting & Site' },
    ]);
  });

  test('breakdownRows has one row per K/L/T/S/D segment with correct values', () => {
    const kitting = model.breakdownRows.find((row) => row.category === 'Kitting & Site');
    expect(kitting).toEqual({ category: 'Kitting & Site', perSample: '$100.00', totalStudy: '$1,000' });
    expect(model.breakdownRows).toHaveLength(5);
  });

  test('assumptionRows includes lever values plus region and expedite metadata', () => {
    const region = model.assumptionRows.find((row) => row.label === 'Region');
    const timeline = model.assumptionRows.find((row) => row.label === 'Timeline');
    expect(region.value).toBe('United States (Baseline)');
    expect(timeline.value).toBe('Standard');
    expect(model.assumptionRows.some((row) => row.label === 'Kit Cost per Sample ($)' && row.value === '100')).toBe(true);
  });

  test('assumptionRows includes the effective (post fine-tune) region multipliers', () => {
    const kittingMultiplier = model.assumptionRows.find((row) => row.label === 'Region Kitting & Site Multiplier');
    expect(kittingMultiplier.value).toBe('1');

    const euInputs = { ...inputs, region: 'eu', region_factor_K: 2 };
    const euModel = buildCalculatorExportModel(euInputs, calculate(euInputs));
    const euKittingMultiplier = euModel.assumptionRows.find((row) => row.label === 'Region Kitting & Site Multiplier');
    const euLogisticsMultiplier = euModel.assumptionRows.find((row) => row.label === 'Region Logistics Multiplier');
    expect(euKittingMultiplier.value).toBe('2'); // fine-tuned override
    expect(euLogisticsMultiplier.value).toBe('1.15'); // untouched, tracks EU preset
  });
});

describe('buildScenarioExportModel', () => {
  const lockedInputs = { ...STARTUP_DEFAULTS, N_participants: 10, K_kit: 100 };
  const scenarioInputs = { ...lockedInputs, region: 'eu' };
  const lockedResult = calculate(lockedInputs);
  const scenarioResult = calculate(scenarioInputs);

  test('falls back to "Custom" label when no built-in preset is active', () => {
    const model = buildScenarioExportModel(lockedResult, scenarioResult, scenarioInputs, null);
    const scenarioRow = model.summaryRows.find((row) => row.label === 'Scenario');
    expect(scenarioRow.value).toBe('Custom');
  });

  test('falls back to "Custom" for a custom-preset activeScenario key (not a built-in preset)', () => {
    const model = buildScenarioExportModel(lockedResult, scenarioResult, scenarioInputs, 'custom:abc123');
    const scenarioRow = model.summaryRows.find((row) => row.label === 'Scenario');
    expect(scenarioRow.value).toBe('Custom');
  });

  test('uses the built-in scenario label when a preset key is active', () => {
    const model = buildScenarioExportModel(lockedResult, scenarioResult, scenarioInputs, 's1');
    const scenarioRow = model.summaryRows.find((row) => row.label === 'Scenario');
    expect(scenarioRow.value).toMatch(/Direct to Central Lab/);
  });

  test('breakdownRows carries signed per-category deltas', () => {
    const model = buildScenarioExportModel(lockedResult, scenarioResult, scenarioInputs, null);
    const kitting = model.breakdownRows.find((row) => row.category === 'Kitting & Site');
    // EU K factor = 1.05 -> delta = (105-100) = +$5.00 per sample
    expect(kitting.perSample).toBe('+$5.00');
  });

  test('summaryRows includes total delta and delta percent', () => {
    const model = buildScenarioExportModel(lockedResult, scenarioResult, scenarioInputs, null);
    const deltaRow = model.summaryRows.find((row) => row.label === 'Total Delta');
    expect(deltaRow.value).toBe('+$50');
  });
});

describe('buildSdExportModel', () => {
  test('store tab summary reflects selection and formula result', () => {
    const storeInputs = { sampleType: 'plasma', containerSize: 'lte4mL', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: 100 };
    const disposeInputs = { sampleType: null, containerSize: null, totalSamples: '' };
    const storeResult = calculateStorage(storeInputs);
    const disposeResult = calculateDisposal(disposeInputs);
    const sdResult = calculateStoreAndDispose(storeInputs, disposeInputs);

    const model = buildSdExportModel('store', storeInputs, disposeInputs, storeResult, disposeResult, sdResult);
    const costRow = model.summaryRows.find((row) => row.label === 'Cost per Sample');
    expect(costRow.value).toBe('$3.02');
    expect(model.title).toContain('Store');
  });

  test('dispose tab summary reflects fixed per-sample cost', () => {
    const storeInputs = { sampleType: null, containerSize: null, storageTemp: null, storageDuration: 0, totalSamples: '' };
    const disposeInputs = { sampleType: 'whole_blood', containerSize: 'lte4mL', totalSamples: '' };
    const storeResult = calculateStorage(storeInputs);
    const disposeResult = calculateDisposal(disposeInputs);
    const sdResult = calculateStoreAndDispose(storeInputs, disposeInputs);

    const model = buildSdExportModel('dispose', storeInputs, disposeInputs, storeResult, disposeResult, sdResult);
    const costRow = model.summaryRows.find((row) => row.label === 'Cost per Sample');
    expect(costRow.value).toBe('$3.54');
  });

  test('storeAndDispose tab summary reflects combined cost', () => {
    const storeInputs = { sampleType: 'plasma', containerSize: 'lte4mL', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: '' };
    const disposeInputs = { sampleType: 'whole_blood', containerSize: 'lte4mL', totalSamples: 10 };
    const storeResult = calculateStorage(storeInputs);
    const disposeResult = calculateDisposal(disposeInputs);
    const sdResult = calculateStoreAndDispose(storeInputs, disposeInputs);

    const model = buildSdExportModel('storeAndDispose', storeInputs, disposeInputs, storeResult, disposeResult, sdResult);
    const costRow = model.summaryRows.find((row) => row.label === 'Cost per Sample');
    expect(costRow.value).toBe('$7.66');
  });
});

describe('buildTieredExportModel', () => {
  const inputs = {
    screenCost: 15,
    confirmCost: 120,
    titerCost: 180,
    screenTat: 3,
    confirmTat: 7,
    titerTat: 10,
    confirmPosPct: 60,
    currentScreenPosPct: 15,
    flatAssayCost: 80,
    flatTat: 12,
    totalSamples: '',
  };
  const analysis = calculateTieredAssay({ ...inputs, screenPosPct: inputs.currentScreenPosPct });
  const model = buildTieredExportModel(inputs, analysis);

  test('summaryRows includes pivot rate and recommendation', () => {
    const pivotRow = model.summaryRows.find((row) => row.label === 'Pivot Rate');
    const recRow = model.summaryRows.find((row) => row.label === 'Recommendation');
    expect(pivotRow.value).toMatch(/^28\.5/);
    expect(recRow.value).toBe('tiered');
  });

  test('breakdownRows includes all three tiers plus flat', () => {
    const categories = model.breakdownRows.map((row) => row.category);
    expect(categories).toEqual(['Screen', 'Confirm', 'Titer', 'Flat']);
  });
});
