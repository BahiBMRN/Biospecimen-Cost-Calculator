import { useEffect, useMemo, useState } from 'react';
import { CONFIG, DEFAULTS, PRESETS } from './constants.js';
import { calculate } from './calculate.js';
import { clamp } from './utils.js';
import CalculatorView from './views/CalculatorView.jsx';
import ScenariosView from './views/ScenariosView.jsx';
import StoreDisposeView from './views/StoreDisposeView.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [calculatorInputs, setCalculatorInputs] = useState(DEFAULTS);
  const [lockedInputs, setLockedInputs] = useState(null);
  const [scenarioInputs, setScenarioInputs] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);

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
    setActiveTab('scenarios');
  };

  return (
    <ErrorBoundary>
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
          Store or Dispose
        </button>
      </nav>

      {activeTab === 'calculator' && (
        <CalculatorView
          volumeItems={volumeItems}
          costGroups={costGroups}
          calculatorInputs={calculatorInputs}
          updateCalculatorValue={updateCalculatorValue}
          calculatorResult={calculatorResult}
          onLockIn={lockCostForScenarioModeling}
        />
      )}

      {activeTab === 'scenarios' && (
        <ScenariosView
          volumeItems={volumeItems}
          costGroups={costGroups}
          effectiveScenarioInputs={effectiveScenarioInputs}
          updateScenarioValue={updateScenarioValue}
          lockedResult={lockedResult}
          scenarioResult={scenarioResult}
          activeScenario={activeScenario}
          applyScenario={applyScenario}
          resetScenarioToLocked={resetScenarioToLocked}
        />
      )}

      {activeTab === 'wif' && <StoreDisposeView />}
    </div>
    </ErrorBoundary>
  );
}

export default App;
