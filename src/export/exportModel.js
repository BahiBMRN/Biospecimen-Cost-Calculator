import { CONFIG, EXPEDITE_TIERS, REGIONS, SCENARIO_LABELS, SD_CONTAINER_SIZES, SD_FIXED_RATES, SD_SAMPLE_TYPES, SD_STORAGE_TEMPS } from '../constants.js';
import { getEffectiveRegionFactors } from '../calculate.js';
import {
  formatCurrency,
  formatCurrencyWhole,
  formatNumber,
  formatSignedCurrency,
  formatSignedCurrencyWhole,
} from '../utils.js';

function describeExpedite(inputs) {
  if (!inputs.expedite_enabled) {
    return { tierLabel: EXPEDITE_TIERS.standard.label, shippingPct: 0, testingPct: 0, reportingPct: 0 };
  }

  const match = Object.keys(EXPEDITE_TIERS).find((key) => {
    const tier = EXPEDITE_TIERS[key];
    return (
      Number(inputs.expedite_shipping_pct) === tier.shipping &&
      Number(inputs.expedite_testing_pct) === tier.testing &&
      Number(inputs.expedite_reporting_pct) === tier.reporting
    );
  });

  return {
    tierLabel: match ? EXPEDITE_TIERS[match].label : 'Custom',
    shippingPct: Number(inputs.expedite_shipping_pct) || 0,
    testingPct: Number(inputs.expedite_testing_pct) || 0,
    reportingPct: Number(inputs.expedite_reporting_pct) || 0,
  };
}

function regionAssumptionRows(inputs) {
  const region = REGIONS.find((r) => r.key === inputs.region) ?? REGIONS[0];
  const expedite = describeExpedite(inputs);
  const factors = getEffectiveRegionFactors(inputs);
  return [
    { label: 'Region', value: region.label },
    { label: 'Region Kitting & Site Multiplier', value: String(factors.K) },
    { label: 'Region Logistics Multiplier', value: String(factors.L) },
    { label: 'Region Testing Multiplier', value: String(factors.T) },
    { label: 'Region Storage Multiplier', value: String(factors.S) },
    { label: 'Region Disposal Multiplier', value: String(factors.D) },
    { label: 'Timeline', value: expedite.tierLabel },
    { label: 'Expedite Shipping Surcharge', value: `${expedite.shippingPct}%` },
    { label: 'Expedite Testing Surcharge', value: `${expedite.testingPct}%` },
    { label: 'Expedite Reporting Surcharge', value: `${expedite.reportingPct}%` },
  ];
}

function leverAssumptionRows(inputs) {
  return CONFIG.map((item) => ({ label: item.label, value: String(inputs[item.key] ?? '') }));
}

export function buildCalculatorExportModel(inputs, result) {
  const topDriver = [...result.segments].sort((a, b) => b.value - a.value)[0];

  return {
    title: 'Calculator',
    generatedAt: new Date().toISOString(),
    summaryRows: [
      { label: 'Total Study Cost', value: formatCurrencyWhole(result.TRUE_COST) },
      { label: 'Cost per Sample', value: formatCurrency(result.C_sample) },
      { label: 'Total Samples', value: formatNumber(result.N_samples) },
      { label: 'Total Shipments', value: formatNumber(result.totalShipmentsRequired) },
      { label: 'Top Driver', value: topDriver?.label ?? 'N/A' },
    ],
    breakdownRows: result.segments.map((seg) => ({
      category: seg.label,
      perSample: formatCurrency(seg.value),
      totalStudy: formatCurrencyWhole(seg.value * result.N_samples),
    })),
    assumptionRows: [...leverAssumptionRows(inputs), ...regionAssumptionRows(inputs)],
  };
}

export function buildScenarioExportModel(lockedResult, scenarioResult, inputs, activeScenario) {
  const scenarioLabel = activeScenario && SCENARIO_LABELS[activeScenario] ? SCENARIO_LABELS[activeScenario] : 'Custom';
  const deltaTotal = scenarioResult.TRUE_COST - lockedResult.TRUE_COST;
  const deltaPct = lockedResult.TRUE_COST === 0 ? null : (deltaTotal / lockedResult.TRUE_COST) * 100;

  return {
    title: 'What-If Scenario',
    generatedAt: new Date().toISOString(),
    summaryRows: [
      { label: 'Scenario', value: scenarioLabel },
      { label: 'Locked Baseline Total', value: formatCurrencyWhole(lockedResult.TRUE_COST) },
      { label: 'Scenario Total', value: formatCurrencyWhole(scenarioResult.TRUE_COST) },
      { label: 'Total Delta', value: formatSignedCurrencyWhole(deltaTotal) },
      { label: 'Total Delta %', value: deltaPct === null ? 'N/A' : `${deltaPct >= 0 ? '+' : '-'}${Math.abs(deltaPct).toFixed(1)}%` },
    ],
    breakdownRows: lockedResult.segments.map((baseSeg, index) => {
      const scenarioSeg = scenarioResult.segments[index];
      return {
        category: baseSeg.label,
        perSample: formatSignedCurrency(scenarioSeg.value - baseSeg.value),
        totalStudy: formatSignedCurrencyWhole((scenarioSeg.value - baseSeg.value) * scenarioResult.N_samples),
      };
    }),
    assumptionRows: [...leverAssumptionRows(inputs), ...regionAssumptionRows(inputs)],
  };
}

export function buildSdExportModel(activeSDTab, storeInputs, disposeInputs, storeResult, disposeResult, sdResult) {
  const sampleTypeLabel = (key) => SD_SAMPLE_TYPES.find((t) => t.key === key)?.label ?? 'N/A';
  const containerLabel = (key) => SD_CONTAINER_SIZES.find((c) => c.key === key)?.label ?? 'N/A';
  const tempLabel = (key) => SD_STORAGE_TEMPS.find((t) => t.key === key)?.label ?? 'N/A';

  const tabTitles = { store: 'Store', dispose: 'Dispose', storeAndDispose: 'Store & Dispose' };

  let summaryRows = [];
  let breakdownRows = [];

  if (activeSDTab === 'store') {
    summaryRows = [
      { label: 'Sample Type', value: sampleTypeLabel(storeInputs.sampleType) },
      { label: 'Container Size', value: containerLabel(storeInputs.containerSize) },
      { label: 'Storage Temp', value: tempLabel(storeInputs.storageTemp) },
      { label: 'Duration (months)', value: String(storeInputs.storageDuration ?? 0) },
      { label: 'Cost per Sample', value: storeResult.perSample != null ? formatCurrency(storeResult.perSample) : 'N/A' },
      { label: 'Total Study Cost', value: storeResult.totalStudy != null ? formatCurrencyWhole(storeResult.totalStudy) : 'N/A' },
    ];
    breakdownRows = [
      { category: 'Registration', perSample: formatCurrency(SD_FIXED_RATES.registration), totalStudy: '' },
      { category: 'Storage Rate', perSample: storeResult.storageRate != null ? `${formatCurrency(storeResult.storageRate)}/mo` : 'N/A', totalStudy: '' },
    ];
  } else if (activeSDTab === 'dispose') {
    summaryRows = [
      { label: 'Sample Type', value: sampleTypeLabel(disposeInputs.sampleType) },
      { label: 'Container Size', value: containerLabel(disposeInputs.containerSize) },
      { label: 'Cost per Sample', value: disposeResult.perSample != null ? formatCurrency(disposeResult.perSample) : 'N/A' },
      { label: 'Total Study Cost', value: disposeResult.totalStudy != null ? formatCurrencyWhole(disposeResult.totalStudy) : 'N/A' },
    ];
    breakdownRows = [
      { category: 'Registration', perSample: formatCurrency(SD_FIXED_RATES.registration), totalStudy: '' },
      { category: 'Disposal', perSample: formatCurrency(SD_FIXED_RATES.disposal), totalStudy: '' },
    ];
  } else {
    summaryRows = [
      { label: 'Container Size', value: containerLabel(storeInputs.containerSize) },
      { label: 'Storage Temp', value: tempLabel(storeInputs.storageTemp) },
      { label: 'Duration (months)', value: String(storeInputs.storageDuration ?? 0) },
      { label: 'Cost per Sample', value: sdResult.perSample != null ? formatCurrency(sdResult.perSample) : 'N/A' },
      { label: 'Total Study Cost', value: sdResult.totalStudy != null ? formatCurrencyWhole(sdResult.totalStudy) : 'N/A' },
    ];
    breakdownRows = [
      { category: 'Storage Portion', perSample: sdResult.storagePortion != null ? formatCurrency(sdResult.storagePortion) : 'N/A', totalStudy: '' },
      { category: 'Disposal Portion', perSample: sdResult.disposalPortion != null ? formatCurrency(sdResult.disposalPortion) : 'N/A', totalStudy: '' },
    ];
  }

  return {
    title: `Store or Dispose — ${tabTitles[activeSDTab] ?? activeSDTab}`,
    generatedAt: new Date().toISOString(),
    summaryRows,
    breakdownRows,
    assumptionRows: [],
  };
}

export function buildTieredExportModel(inputs, analysis) {
  const pivotRateLabel = analysis.pivotRate == null ? 'N/A' : `${analysis.pivotRate.toFixed(1)}%`;

  return {
    title: 'Tiered Assays Pivot Point',
    generatedAt: new Date().toISOString(),
    summaryRows: [
      { label: 'Tiered Cost per Sample', value: formatCurrency(analysis.tieredPerSample) },
      { label: 'Flat Cost per Sample', value: formatCurrency(analysis.flatPerSample) },
      { label: 'Pivot Rate', value: pivotRateLabel },
      { label: 'Pivot Kind', value: analysis.pivotKind },
      { label: 'Recommendation', value: analysis.recommendation },
      { label: 'Tiered Turnaround (worst case, days)', value: String(analysis.tieredTatWorst) },
      { label: 'Flat Turnaround (days)', value: String(analysis.flatTatValue) },
    ],
    breakdownRows: [
      { category: 'Screen', perSample: formatCurrency(inputs.screenCost), totalStudy: `${inputs.screenTat} days` },
      { category: 'Confirm', perSample: formatCurrency(inputs.confirmCost), totalStudy: `${inputs.confirmTat} days` },
      { category: 'Titer', perSample: formatCurrency(inputs.titerCost), totalStudy: `${inputs.titerTat} days` },
      { category: 'Flat', perSample: formatCurrency(inputs.flatAssayCost), totalStudy: `${inputs.flatTat} days` },
    ],
    assumptionRows: [
      { label: 'Screen Positivity Rate', value: `${inputs.currentScreenPosPct}%` },
      { label: 'Confirm Positivity Rate', value: `${inputs.confirmPosPct}%` },
      { label: 'Total Samples', value: inputs.totalSamples === '' ? 'N/A' : String(inputs.totalSamples) },
    ],
  };
}
