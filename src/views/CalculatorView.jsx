import { GROUP_ABBREV } from '../constants.js';
import { categoryClass } from '../utils.js';
import AssumptionsCaveats from '../components/AssumptionsCaveats.jsx';
import BreakdownChart from '../components/BreakdownChart.jsx';
import CostComposition from '../components/CostComposition.jsx';
import NumberControl from '../components/NumberControl.jsx';

export default function CalculatorView({ volumeItems, costGroups, calculatorInputs, updateCalculatorValue, calculatorResult, onLockIn }) {
  return (
    <div className="shell">
      <section className="hero">
        <h1>Biospecimen Study Lifetime Cost Calculator</h1>
        <p className="sub">
          <span className="hero-dot" />
          Model the cost of biospecimen collections for the lifetime of the study by adjusting the below parameters to view cost impacts in real time
          <span className="hero-dot" style={{ marginRight: 0, marginLeft: 10 }} />
        </p>
      </section>

      <div className="layout">
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

        <main className="main-grid">
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

          <CostComposition result={calculatorResult} showLockButton onLockIn={onLockIn} />

          <section className="panel">
            <BreakdownChart segments={calculatorResult.segments} N_samples={calculatorResult.N_samples} />
          </section>
        </main>
      </div>
    </div>
  );
}
