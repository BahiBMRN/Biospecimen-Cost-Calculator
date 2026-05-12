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
    changes: ['Shipment legs per sample = 2', 'Storage receipt = 1.22', 'Storage rate = 0.07', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s3: {
    changes: ['Shipment legs per sample = 3', 'Storage receipt = 1.22', 'Storage rate = 0.07', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s4: {
    changes: ['Shipment legs per sample = 2', 'Accessioning cost set to 0', 'All testing values set to 0', 'Storage duration = 300 months'],
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ceilDiv(a, b) {
  return Math.ceil(Number(a) / Math.max(1, Number(b)));
}

function calculate(inputs) {
  const N_samples = Number(inputs.N_subjects) * Number(inputs.N_visits) * Number(inputs.N_timepoints) * Number(inputs.N_aliquots);
  const K = Number(inputs.K_kit) + Number(inputs.K_site) + Number(inputs.K_special);
  const L = (Number(inputs.L_ship) / Math.max(1, Number(inputs.N_samples_ship))) * Number(inputs.N_shipments) + Number(inputs.L_accession);
  const T_data = Number(inputs.T_data_total) / Math.max(1, N_samples);
  const T = Number(inputs.T_process) + Number(inputs.T_test) + T_data;
  const S = Number(inputs.S_setup) + Number(inputs.S_rate) * Number(inputs.S_duration);
  const D = Number(inputs.D_retrieve) + Number(inputs.D_destroy) + Number(inputs.D_doc);
  const C_sample = K + L + T + S + D;
  const TRUE_COST = C_sample * N_samples;
  const totalShipmentsRequired = ceilDiv(N_samples, inputs.N_samples_ship) * Number(inputs.N_shipments);
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

function BreakdownChart({ segments }) {
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  return (
    <div className="chart-block">
      <h3>Cost Breakdown</h3>
      <div className="bar-area">
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={160} tick={{ fill: '#aeb9d6', fontSize: 24 }} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              cursor={false}
              contentStyle={{ color: '#111' }}
              labelStyle={{ color: '#111', fontWeight: 600 }}
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

function DeltaComparisonChart() {
  return (
    <div className="chart-block delta-chart-block">
      <h3>Scenario Difference View</h3>
      <div className="delta-placeholder">
        <strong>Placeholder for future update</strong>
        <p>
          The difference graph is being redesigned for better readability and decision support.
          A new version will be added in a later update.
        </p>
      </div>
    </div>
  );
}

function CostComposition({ result, variant = 'default', showLockButton = false, onLockIn }) {
  const pieData = result.segments.map((segment) => ({
    ...segment,
    percent: (segment.value / (result.C_sample || 1)) * 100,
  }));

  const variantMap = {
    locked: { className: 'locked-composition', badge: 'Locked Baseline' },
    scenario: { className: 'scenario-composition', badge: 'Scenario Output' },
    default: { className: '', badge: '' },
  };
  const styleVariant = variantMap[variant] || variantMap.default;

  return (
    <section className={`panel result-card ${styleVariant.className}`}>
      <div className="result-grid">
        <div>
          {styleVariant.badge && <div className="composition-badge">{styleVariant.badge}</div>}
          <div className="score-label">Cost per sample</div>
          <h2 className="score-value">{formatCurrency(result.C_sample)}</h2>
          <p className="equation-line">
            K({formatCurrency(result.K)}) + L({formatCurrency(result.L)}) + T({formatCurrency(result.T)}) + S({formatCurrency(result.S)}) + D({formatCurrency(result.D)})
          </p>
        </div>
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
        <div className="interpretation">
          <div className="score-label">Interpretation</div>
          <p>
            With {formatNumber(result.N_samples)} total samples, this study needs {formatNumber(result.totalShipmentsRequired)} shipments.
          </p>
          <p>Total study cost: {formatCurrency(result.TRUE_COST)}</p>
          {showLockButton && (
            <button className="interpretation-lock-btn" onClick={onLockIn}>
              Lock Cost In For Scenario Modeling
            </button>
          )}
        </div>
      </div>
      <div className="metrics">
        <div className="metric metric-important">
          <div className="label">Total study cost</div>
          <div className="big">{formatCurrency(result.TRUE_COST)}</div>
        </div>
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

  const applyScenario = (scenario) => {
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
        <div className="tab-bar-logo">
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
        </div>
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
            <div className="eyebrow"><span className="dot" /> Biospecimen lifetime cost model</div>
            <h1>{activeTab === 'calculator' ? 'Interactive Biospecimen Study Lifetime Cost Calculator' : 'What-If Scenarios'}</h1>
            <p className="sub">
              {activeTab === 'calculator'
                ? 'This calculator models the cost of biospecimen collections for the lifetime of the study. Adjust the below parameters to view cost impacts in real time.'
                : 'Scenario modeling is read-only. Select a predefined scenario to compare against locked baseline values, then use Calculator to change sample variables.'}
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
                      <summary>{groupObj.group}</summary>
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
                  <div className="head">
                    <h2 className="scenario-heading">Scenarios</h2>
                    <button className="reset-scenario-btn" onClick={resetScenarioToLocked}>Reset</button>
                  </div>
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
                            onChange={updateCalculatorValue}
                            disabled
                            lockHint="To Change Variables Use Calculator"
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
                            <summary>{groupObj.group}</summary>
                            <div className="accordion-content">
                              {groupObj.items.map((item) => (
                                <NumberControl
                                  key={item.key}
                                  item={item}
                                  value={effectiveScenarioInputs[item.key]}
                                  onChange={updateCalculatorValue}
                                  withSlider
                                  disabled
                                  lockHint="To Change Variables Use Calculator"
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
                    <BreakdownChart segments={calculatorResult.segments} />
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
                          <div className="mini dim">Scenario values are applied on top of the locked baseline. Sample Levers remain read-only here.</div>
                          <div className="mini"><strong>Changes:</strong> {SCENARIO_META[activeScenario].changes.join(' | ')}</div>
                          <div className="mini"><strong>Unchanged:</strong> {SCENARIO_META[activeScenario].constants.join(' | ')}</div>
                        </>
                      ) : (
                        <>
                          <div className="assump-title">No Scenario Applied</div>
                          <div className="mini dim">Values currently match the locked baseline. Select a scenario to model changes, or use Reset to return here.</div>
                          <div className="mini"><strong>Locked mode:</strong> Sample and study variables are read-only in What-If Scenarios.</div>
                          <div className="mini">Use Calculator to change baseline values, then lock again. Top card is locked baseline and bottom card is scenario output.</div>
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
