import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './App.css';

const COLORS = ['#70e1ff', '#9a7cff', '#64f0a8', '#ffd166', '#ff7b8a'];

const CONFIG = [
  { key: 'N_subjects', label: 'Subjects', category: 'Volume', min: 1, max: 2000, step: 1, value: 100 },
  { key: 'N_visits', label: 'Visits', category: 'Volume', min: 1, max: 40, step: 1, value: 5 },
  { key: 'N_timepoints', label: 'Timepoints', category: 'Volume', min: 1, max: 20, step: 1, value: 2 },
  { key: 'N_aliquots', label: 'Aliquots', category: 'Volume', min: 1, max: 10, step: 1, value: 2 },
  { key: 'K_kit', label: 'Kit Cost per Sample ($)', category: 'Kitting & Site', min: 0, max: 200, step: 1, value: 18 },
  { key: 'K_site', label: 'Site Cost per Sample ($)', category: 'Kitting & Site', min: 0, max: 300, step: 1, value: 22 },
  { key: 'K_special', label: 'Special Handling Cost per Sample ($)', category: 'Kitting & Site', min: 0, max: 500, step: 1, value: 0 },
  { key: 'L_ship', label: 'Avg Cost per Shipment ($)', category: 'Logistics', min: 0, max: 2000, step: 10, value: 120 },
  { key: 'N_samples_ship', label: 'Avg # Samples per Shipment', category: 'Logistics', min: 1, max: 200, step: 1, value: 10 },
  { key: 'N_shipments', label: '# Shipment Legs per Sample', category: 'Logistics', min: 1, max: 6, step: 1, value: 1 },
  { key: 'L_accession', label: 'Accessioning Cost per Sample ($)', category: 'Logistics', min: 0, max: 100, step: 1, value: 6 },
  { key: 'T_process', label: 'Lab Processing Cost per Sample ($)', category: 'Testing', min: 0, max: 500, step: 1, value: 12 },
  { key: 'T_test', label: 'Assay Cost per Sample ($)', category: 'Testing', min: 0, max: 5000, step: 5, value: 80 },
  { key: 'T_data_total', label: 'Total Data Transfer Cost ($)', category: 'Testing', min: 0, max: 200000, step: 100, value: 5000 },
  { key: 'S_setup', label: 'LTS Receipt Cost per Sample ($)', category: 'Storage', min: 0, max: 200, step: 1, value: 5 },
  { key: 'S_rate', label: 'LTS Monthly Storage Rate ($)', category: 'Storage', min: 0, max: 50, step: 0.1, value: 0.25 },
  { key: 'S_duration', label: 'LTS Storage Duration (months)', category: 'Storage', min: 0, max: 500, step: 1, value: 0 },
  { key: 'D_retrieve', label: 'Retrieval Cost per Sample ($)', category: 'Disposal', min: 0, max: 200, step: 1, value: 2 },
  { key: 'D_destroy', label: 'Destruction Cost per Sample ($)', category: 'Disposal', min: 0, max: 200, step: 1, value: 6 },
  { key: 'D_doc', label: 'Destruction Documentation Cost per Sample ($)', category: 'Disposal', min: 0, max: 200, step: 1, value: 2 },
];

const PRESETS = {
  s1: { N_shipments: 1, S_setup: 0, S_rate: 0, S_duration: 0, D_retrieve: 0, D_destroy: 0, D_doc: 0 },
  s2: { N_shipments: 2, S_setup: 1.22, S_rate: 0.07, S_duration: 300, D_retrieve: 2.32, D_destroy: 2.32, D_doc: 0 },
  s3: { N_shipments: 3, S_setup: 1.22, S_rate: 0.07, S_duration: 300, D_retrieve: 2.32, D_destroy: 2.32, D_doc: 0 },
  s4: {
    N_shipments: 2,
    L_accession: 0,
    T_process: 0,
    T_test: 0,
    T_data_total: 0,
    S_setup: 1.22,
    S_rate: 0.07,
    S_duration: 300,
    D_retrieve: 2.32,
    D_destroy: 2.32,
    D_doc: 0,
  },
};

const SCENARIO_LABELS = {
  s1: 'Direct to Central Lab -> Single Analysis, No Residuals, No LTS',
  s2: 'Direct to Central Lab Analysis -> Residual LTS (25 Year Consent)',
  s3: 'Direct to Central Lab -> Specialty Lab Testing -> Residual LTS (25 Year Consent)',
  s4: 'LTS Only: No CL Routing, No Analysis (25 Year Consent)',
};

const SCENARIO_META = {
  s1: {
    changes: ['Shipment legs per sample = 1', 'Storage values set to 0', 'Disposal values set to 0'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s2: {
    changes: ['Shipment legs per sample = 2', 'Storage receipt = $1.22', 'Storage rate = $0.07', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s3: {
    changes: ['Shipment legs per sample = 3', 'Storage receipt = $1.22', 'Storage rate = $0.07', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s4: {
    changes: ['Shipment legs per sample = 2', 'Accessioning cost set to $0', 'All testing values set to 0', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs'],
  },
};

const DEFAULTS = Object.fromEntries(CONFIG.map((item) => [item.key, item.value]));

function formatNumber(v) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(v));
}

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(v));
}

function formatCurrencyWhole(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function getScoreValueFontSize(formattedStr) {
  const len = formattedStr.length;
  if (len <= 8) return 'clamp(3.5rem, 5vw, 5.5rem)';
  if (len <= 11) return 'clamp(2.6rem, 4vw, 4rem)';
  if (len <= 14) return 'clamp(1.9rem, 3vw, 3rem)';
  return 'clamp(1.4rem, 2.5vw, 2.4rem)';
}

function formatSignedCurrency(v) {
  const numeric = Number(v);
  if (numeric === 0) {
    return formatCurrency(0);
  }
  return `${numeric > 0 ? '+' : '-'}${formatCurrency(Math.abs(numeric))}`;
}

function formatSignedCurrencyWhole(v) {
  const numeric = Number(v);
  if (numeric === 0) {
    return formatCurrencyWhole(0);
  }
  return `${numeric > 0 ? '+' : '-'}${formatCurrencyWhole(Math.abs(numeric))}`;
}

function formatSignedPercent(v) {
  if (!Number.isFinite(Number(v))) {
    return 'N/A';
  }

  const numeric = Number(v);
  if (numeric === 0) {
    return '0.0%';
  }

  return `${numeric > 0 ? '+' : '-'}${Math.abs(numeric).toFixed(1)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ceilDiv(a, b) {
  return Math.ceil(Number(a) / Number(b));
}

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

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{row.label}</strong>
      <div>{formatCurrency(row.value)}</div>
      <div>{row.percent.toFixed(0)}%</div>
    </div>
  );
}

function BreakdownChart({ segments, N_samples }) {
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  return (
    <div className="chart-block">
      <h3>Cost Breakdown</h3>
      <div className="bar-area">
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={160} tick={{ fill: '#aeb9d6', fontSize: 20 }} tickFormatter={(label) => `${label} (${GROUP_ABBREV[label] ?? label})`} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const { label, value } = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <strong>{label}</strong>
                    <div>Per Sample: {formatCurrency(value)}</div>
                    <div>Total Study: {formatCurrencyWhole(value * N_samples)}</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 8, 8]}>
              {sorted.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DeltaComparisonChart({ baselineResult, scenarioResult }) {
  const componentRows = [
    { label: 'K', baseline: baselineResult.K, scenario: scenarioResult.K, color: baselineResult.segments[0].color },
    { label: 'L', baseline: baselineResult.L, scenario: scenarioResult.L, color: baselineResult.segments[1].color },
    { label: 'T', baseline: baselineResult.T, scenario: scenarioResult.T, color: baselineResult.segments[2].color },
    { label: 'S', baseline: baselineResult.S, scenario: scenarioResult.S, color: baselineResult.segments[3].color },
    { label: 'D', baseline: baselineResult.D, scenario: scenarioResult.D, color: baselineResult.segments[4].color },
  ].map((row) => ({
    ...row,
    delta: row.scenario - row.baseline,
  }));

  const componentDomainMax = Math.max(1, ...componentRows.map((row) => Math.abs(row.delta))) * 1.15;

  const deltaTotal = scenarioResult.TRUE_COST - baselineResult.TRUE_COST;
  const totalPercentDelta = baselineResult.TRUE_COST === 0 ? null : (deltaTotal / baselineResult.TRUE_COST) * 100;
  const totalDomainMax = Math.max(1, Math.abs(deltaTotal)) * 1.15;

  const getHalfWidthPercent = (value, domainMax) => {
    if (!domainMax) {
      return 0;
    }

    return Math.min(50, (Math.abs(value) / domainMax) * 50);
  };

  return (
    <div className="chart-block delta-chart-block">

      <div className="delta-section">
        <div className="delta-section-title">Per-Sample Cost Delta</div>
        <div className="delta-rows">
          {componentRows.map((row, index) => {
            const barWidth = getHalfWidthPercent(row.delta, componentDomainMax);
            const barStyle = row.delta >= 0
              ? { left: '50%', width: `${barWidth}%` }
              : { left: `${50 - barWidth}%`, width: `${barWidth}%` };

            return (
              <div
                className="delta-row"
                key={row.label}
                data-testid={`delta-row-${index}`}
                title={`Baseline ${formatCurrency(row.baseline)} | Scenario ${formatCurrency(row.scenario)} | Delta ${formatSignedCurrency(row.delta)}`}
              >
                <div className="delta-row-label" style={{ color: row.color }}>{row.label}</div>
                <div className="delta-row-track">
                  <div className="delta-row-zero" />
                  {row.delta !== 0 && <div className={`delta-row-bar ${row.delta > 0 ? 'positive' : 'negative'}`} style={barStyle} />}
                </div>
                <div className={`delta-row-value ${row.delta > 0 ? 'positive' : row.delta < 0 ? 'negative' : 'neutral'}`}>
                  {formatSignedCurrency(row.delta)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="delta-total-card" data-testid="total-study-delta-card">
        <div className="delta-section-title">Total Study Cost Delta</div>
        <div className={`delta-total-value ${deltaTotal > 0 ? 'positive' : deltaTotal < 0 ? 'negative' : 'neutral'}`}>
          {formatSignedCurrencyWhole(deltaTotal)}
        </div>
        <div className="delta-total-rail">
          <div className="delta-row-zero" />
          {deltaTotal !== 0 && (
            <div
              className={`delta-total-marker ${deltaTotal > 0 ? 'positive' : 'negative'}`}
              style={
                deltaTotal > 0
                  ? { left: '50%', width: `${getHalfWidthPercent(deltaTotal, totalDomainMax)}%` }
                  : { left: `${50 - getHalfWidthPercent(deltaTotal, totalDomainMax)}%`, width: `${getHalfWidthPercent(deltaTotal, totalDomainMax)}%` }
              }
            />
          )}
        </div>
        <div className="delta-total-percent" data-testid="total-study-delta-percent">
          {totalPercentDelta === null ? 'Percent delta unavailable at $0 baseline' : `${totalPercentDelta > 0 ? '+' : totalPercentDelta < 0 ? '-' : ''}${Math.abs(totalPercentDelta).toFixed(0)}% Δ`}
        </div>
      </div>
    </div>
  );
}

function CostComposition({ result, variant = 'default', showLockButton = false, onLockIn }) {
  const isCalculatorView = variant === 'default';
  const pieData = !isCalculatorView
    ? result.segments.map((segment) => ({
        ...segment,
        percent: (segment.value / (result.C_sample || 1)) * 100,
      }))
    : null;

  const variantMap = {
    locked: { className: 'locked-composition', badge: 'Locked Baseline' },
    scenario: { className: 'scenario-composition', badge: 'Scenario Output' },
    default: { className: '', badge: '' },
  };
  const styleVariant = variantMap[variant] || variantMap.default;

  const formattedTotal = isCalculatorView ? formatCurrencyWhole(result.TRUE_COST) : null;

  return (
    <section className={`panel result-card ${styleVariant.className}`}>
      {styleVariant.badge && <div className="result-card-badge-row"><div className="composition-badge">{styleVariant.badge}</div></div>}
      <div className={`result-grid${isCalculatorView ? ' result-grid--calculator' : ''}`}>
        <div className={isCalculatorView ? 'score-box' : 'score-box--blue'}>
          <div className="score-label">{isCalculatorView ? 'TOTAL STUDY COST' : 'Cost per sample'}</div>
          {isCalculatorView ? (
            <h2 className="score-value" style={{ fontSize: getScoreValueFontSize(formattedTotal) }}>
              {formattedTotal}
            </h2>
          ) : (
            <h2 className="score-value">{formatCurrency(result.C_sample)}</h2>
          )}

        </div>
        {!isCalculatorView && (
          <div className="donut-area">
            <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={54} outerRadius={78} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="interpretation">
          {isCalculatorView ? (
            <div className="interpretation-calc-layout">
              <div className="study-equation">
                <div className="score-label" style={{ marginBottom: 6 }}>Cost Breakdown</div>
                {result.segments.map((seg) => (
                  <span key={seg.label}>
                    <span style={{ color: seg.color }}>
                      <strong>{seg.label} ({GROUP_ABBREV[seg.label]})</strong>
                      {' = '}{formatCurrencyWhole(seg.value * result.N_samples)}
                    </span>
                  </span>
                ))}
              </div>
              {showLockButton && (
                <button className="interpretation-lock-btn" onClick={onLockIn}>
                  Lock In Cost For Scenario Modeling
                </button>
              )}
            </div>
          ) : (
            <div className="study-equation">
              <div className="score-label" style={{ marginBottom: 6 }}>Per Sample Breakdown</div>
              {result.segments.map((seg) => (
                <span key={seg.label}>
                  <span style={{ color: seg.color }}>
                    <strong>{seg.label} ({GROUP_ABBREV[seg.label]})</strong>
                    {' = '}{formatCurrency(seg.value)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="metrics">
        {isCalculatorView ? (
          <div className="metric metric-important metric-important--cps">
            <div className="cps-label-stack">
              <span>Cost</span>
              <span>Per</span>
              <span>Sample</span>
            </div>
            <div className="cps-value">{formatCurrency(result.C_sample)}</div>
          </div>
        ) : (
          <div className="metric metric-important">
            <div className="label">Total study cost</div>
            <div className="big">{formatCurrencyWhole(result.TRUE_COST)}</div>
          </div>
        )}
        <div className="metric">
          <div className="label">Total samples</div>
          <div className="big">{formatNumber(result.N_samples)}</div>
        </div>
        <div className="metric">
          <div className="label">Total shipments</div>
          <div className="big">{formatNumber(result.totalShipmentsRequired)}</div>
        </div>
        <div className="metric">
          <div className="label">Top driver</div>
          <div className="big">{[...result.segments].sort((a, b) => b.value - a.value)[0].label}</div>
        </div>
      </div>
    </section>
  );
}

function NumberControl({ item, value, onChange, withSlider, disabled = false, lockHint = '' }) {
  const controlTitle = disabled ? lockHint : undefined;

  return (
    <div className={`control ${withSlider ? '' : 'study-control'} ${disabled ? 'is-locked' : ''}`}>
      <div className="control-header">
        <label htmlFor={item.key}>{item.label}</label>
        <div className="control-input-group">
          <input
            type="number"
            id={item.key}
            value={value}
            step={item.step}
            min={item.min}
            max={item.max}
            disabled={disabled}
            title={controlTitle}
            onChange={(event) => {
              if (!disabled) {
                onChange(item.key, Number(event.target.value));
              }
            }}
          />
        </div>
      </div>
      {withSlider && (
        <input
          type="range"
          id={`${item.key}-range`}
          min={item.min}
          max={item.max}
          step={item.step}
          value={value}
          disabled={disabled}
          title={controlTitle}
          onChange={(event) => {
            if (!disabled) {
              onChange(item.key, Number(event.target.value));
            }
          }}
        />
      )}
    </div>
  );
}

function AssumptionsCaveats() {
  return (
    <div className="notes">
      <strong>Cost Normalization Assumptions</strong>
      <br />
      Cost per sample is calculated by dividing the average cost by the number of samples, then multiplying by the output unit.
      <br />
      <br />
      <strong>Caveats</strong>
      <br />
      This model assumes steady-state operations, average costs, and no extraordinary rework, sample loss, or protocol amendments. Real-world studies may vary due to site performance, assay variability, or changes in study design.
    </div>
  );
}

function categoryClass(group) {
  return group
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const GROUP_ABBREV = {
  'Kitting & Site': 'K',
  'Logistics': 'L',
  'Testing': 'T',
  'Storage': 'S',
  'Disposal': 'D',
};

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [calculatorInputs, setCalculatorInputs] = useState({ ...DEFAULTS, ...PRESETS.s1 });
  const [lockedInputs, setLockedInputs] = useState(null);
  const [scenarioInputs, setScenarioInputs] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [isScenarioLocked, setIsScenarioLocked] = useState(false);

  const volumeItems = useMemo(() => CONFIG.filter((item) => item.category === 'Volume'), []);
  const costGroups = useMemo(() => {
    const groups = ['Kitting & Site', 'Logistics', 'Testing', 'Storage', 'Disposal'];
    return groups.map((group) => ({
      group,
      items: CONFIG.filter((item) => item.category === group),
    }));
  }, []);

  const lockedBaselineInputs = useMemo(() => lockedInputs ?? calculatorInputs, [lockedInputs, calculatorInputs]);
  const effectiveScenarioInputs = useMemo(() => scenarioInputs ?? lockedBaselineInputs, [scenarioInputs, lockedBaselineInputs]);

  const calculatorResult = useMemo(() => calculate(calculatorInputs), [calculatorInputs]);
  const lockedResult = useMemo(() => calculate(lockedBaselineInputs), [lockedBaselineInputs]);
  const scenarioResult = useMemo(() => calculate(effectiveScenarioInputs), [effectiveScenarioInputs]);

  useEffect(() => {
    if (activeTab !== 'scenarios') {
      return;
    }

    if (!lockedInputs) {
      const baseline = { ...calculatorInputs };
      setLockedInputs(baseline);
      setScenarioInputs(baseline);
      return;
    }

    if (!scenarioInputs) {
      setScenarioInputs({ ...lockedInputs });
    }
  }, [activeTab, calculatorInputs, lockedInputs, scenarioInputs]);

  const updateCalculatorValue = (key, rawValue) => {
    const item = CONFIG.find((entry) => entry.key === key);
    if (!item || Number.isNaN(rawValue)) {
      return;
    }

    setCalculatorInputs((current) => ({
      ...current,
      [key]: clamp(rawValue, item.min, item.max),
    }));
  };

  const updateScenarioValue = (key, rawValue) => {
    const item = CONFIG.find((entry) => entry.key === key);
    if (!item || Number.isNaN(rawValue)) {
      return;
    }

    setActiveScenario(null);
    setScenarioInputs((current) => ({
      ...(current ?? lockedBaselineInputs),
      [key]: clamp(rawValue, item.min, item.max),
    }));
  };

  const applyScenario = (scenario) => {
    if (activeScenario === scenario) {
      setScenarioInputs({ ...lockedBaselineInputs });
      setActiveScenario(null);
      return;
    }

    setActiveScenario(scenario);
    setScenarioInputs({ ...lockedBaselineInputs, ...PRESETS[scenario] });
  };

  const resetScenarioToLocked = () => {
    setScenarioInputs({ ...lockedBaselineInputs });
    setActiveScenario(null);
  };

  const lockCostForScenarioModeling = () => {
    const baseline = { ...calculatorInputs };
    setLockedInputs(baseline);
    setScenarioInputs(baseline);
    setActiveScenario(null);
    setIsScenarioLocked(true);
    setActiveTab('scenarios');
  };

  return (
    <div className="app">
      <nav className="tab-bar">
        <a
          className="tab-bar-logo"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setActiveTab('calculator');
          }}
          aria-label="Go to home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#70e1ff" />
                <stop offset="1" stopColor="#9a7cff" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="#0b1020" />
            <path d="M24 10h16v6h-2v16.5l10.2 15.8A6 6 0 0 1 43.2 58H20.8a6 6 0 0 1-5-9.7L26 32.5V16h-2v-6zm6 6v18.1l-10.1 15.6a2 2 0 0 0 1.7 3.3h20.8a2 2 0 0 0 1.7-3.3L34 34.1V16h-4z" fill="url(#tg)" />
          </svg>
          B$LCC
        </a>
        <button className={activeTab === 'calculator' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('calculator')}>
          Calculator
        </button>
        <button className={activeTab === 'scenarios' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('scenarios')}>
          What-If Scenarios
        </button>
        <button className={activeTab === 'wif' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('wif')}>
          Store or Dispose <span className="tab-btn-soon">Soon</span>
        </button>
      </nav>

      {(activeTab === 'calculator' || activeTab === 'scenarios') && (
        <div className="shell">
          <section className="hero">
            <h1>{activeTab === 'calculator' ? 'Biospecimen Study Lifetime Cost Calculator' : 'What-If Scenarios'}</h1>
            <p className="sub">
              <span className="hero-dot" />
              {activeTab === 'calculator'
                ? 'Model the cost of biospecimen collections for the lifetime of the study by adjusting the below parameters to view cost impacts in real time'
                : 'Select a predefined scenario or fine-tune study and sample levers to see impact on total costs'}
              <span className="hero-dot" style={{ marginRight: 0, marginLeft: 10 }} />
            </p>
          </section>

          <div className={activeTab === 'calculator' ? 'layout' : 'layout scenario-layout'}>
            {activeTab === 'calculator' ? (
              <aside className="panel sidebar">
                <div className="head">
                  <h2 className="lever-heading">Sample Levers</h2>
                </div>
                <div className="controls">
                  {costGroups.map((groupObj) => (
                    <details className={`accordion cat-${categoryClass(groupObj.group)}`} key={groupObj.group}>
                      <summary>{groupObj.group} ({GROUP_ABBREV[groupObj.group]})</summary>
                      <div className="accordion-content">
                        {groupObj.items.map((item) => (
                          <NumberControl key={item.key} item={item} value={calculatorInputs[item.key]} onChange={updateCalculatorValue} withSlider />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
                <div className="head with-top-border">
                  <h3>Assumptions and Caveats</h3>
                </div>
                <div className="controls">
                  <AssumptionsCaveats />
                </div>
              </aside>
            ) : (
              <aside id="scenarioLeftSidebar">
                <div className="panel" id="scenarioBtnPanel">
                  <div className="controls">
                    <details className="accordion scenario-list-accordion" open>
                      <summary>
                        <span className="scenario-heading">Presets</span>
                        <button
                          type="button"
                          className="reset-scenario-btn"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            resetScenarioToLocked();
                          }}
                        >
                          Reset
                        </button>
                      </summary>
                      <div className="accordion-content">
                        <div className="button-row scenario-buttons">
                          {Object.keys(SCENARIO_LABELS).map((scenario) => (
                            <button
                              key={scenario}
                              className={activeScenario === scenario ? 'active' : ''}
                              onClick={() => applyScenario(scenario)}
                            >
                              {SCENARIO_LABELS[scenario]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="panel" id="scenarioStudyLeversPanel">
                  <div className="controls">
                    <details className="accordion scenario-study-levers">
                      <summary>Study Levers</summary>
                      <div className="accordion-content volume-grid">
                        {volumeItems.map((item) => (
                          <NumberControl
                            key={item.key}
                            item={item}
                            value={effectiveScenarioInputs[item.key]}
                            onChange={updateScenarioValue}
                          />
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
                <div className="panel" id="scenarioSampleLeversPanel">
                  <div className="controls">
                    <details className="accordion scenario-sample-levers" open>
                      <summary>Sample Levers</summary>
                      <div className="accordion-content">
                        {costGroups.map((groupObj) => (
                          <details className={`accordion cat-${categoryClass(groupObj.group)}`} key={groupObj.group}>
                            <summary>{groupObj.group} ({GROUP_ABBREV[groupObj.group]})</summary>
                            <div className="accordion-content">
                              {groupObj.items.map((item) => (
                                <NumberControl
                                  key={item.key}
                                  item={item}
                                  value={effectiveScenarioInputs[item.key]}
                                  onChange={updateScenarioValue}
                                  withSlider
                                />
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </aside>
            )}

            <main className="main-grid">
              {activeTab === 'calculator' && (
                <section className="panel">
                  <div className="head">
                    <h3 className="lever-heading">Study Levers</h3>
                  </div>
                  <div className="controls volume-grid">
                    {volumeItems.map((item) => (
                      <NumberControl
                        key={item.key}
                        item={item}
                        value={calculatorInputs[item.key]}
                        onChange={updateCalculatorValue}
                        lockHint="To Change Variables Use Calculator"
                      />
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'calculator' ? (
                <>
                  <CostComposition result={calculatorResult} showLockButton onLockIn={lockCostForScenarioModeling} />
                  <section className="panel">
                    <BreakdownChart segments={calculatorResult.segments} N_samples={calculatorResult.N_samples} />
                  </section>
                </>
              ) : (
                <>
                  <div className="scenario-results-stack">
                    <CostComposition result={lockedResult} variant="locked" />
                    <section className="panel scenario-assumptions-panel assumptions assumptions-compact">
                      {activeScenario ? (
                        <>
                          <div className="assump-title">Scenario Assumptions: {SCENARIO_LABELS[activeScenario]}</div>
                          <div className="mini"><strong>Changed:</strong> {SCENARIO_META[activeScenario].changes.join(' | ')}</div>
                          <div className="mini"><strong>Unchanged:</strong> {SCENARIO_META[activeScenario].constants.join(' | ')}</div>
                        </>
                      ) : (
                        <>
                          <div className="assump-title">Custom Scenario Comparison</div>
                          <div className="mini dim">This view reflects your custom configured lever values in real time. Click a preset button for programmed scenarios.</div>
                        </>
                      )}
                    </section>
                    <CostComposition result={scenarioResult} variant="scenario" />
                  </div>
                </>
              )}
            </main>

            {activeTab === 'scenarios' && (
              <aside id="scenarioRightSidebar">
                <section className="panel">
                  <DeltaComparisonChart baselineResult={lockedResult} scenarioResult={scenarioResult} />
                </section>
              </aside>
            )}
          </div>
        </div>
      )}

      {activeTab === 'wif' && (
        <div className="shell">
          <section className="hero">
            <h1>Store or Dispose</h1>
            <p>Storage and disposal what-if module is coming soon.</p>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
