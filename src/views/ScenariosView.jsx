import { GROUP_ABBREV, SCENARIO_LABELS, SCENARIO_META } from '../constants.js';
import { categoryClass } from '../utils.js';
import CostComposition from '../components/CostComposition.jsx';
import DeltaComparisonChart from '../components/DeltaComparisonChart.jsx';
import NumberControl from '../components/NumberControl.jsx';

export default function ScenariosView({
  volumeItems,
  costGroups,
  effectiveScenarioInputs,
  updateScenarioValue,
  lockedResult,
  scenarioResult,
  activeScenario,
  applyScenario,
  resetScenarioToLocked,
}) {
  return (
    <div className="shell">
      <section className="hero">
        <h1>What-If Scenarios</h1>
        <p className="sub">
          <span className="hero-dot" />
          Select a predefined scenario or fine-tune study and sample levers to see impact on total costs
          <span className="hero-dot" style={{ marginRight: 0, marginLeft: 10 }} />
        </p>
      </section>

      <div className="layout scenario-layout">
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

        <main className="main-grid">
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
        </main>

        <aside id="scenarioRightSidebar">
          <section className="panel">
            <DeltaComparisonChart baselineResult={lockedResult} scenarioResult={scenarioResult} />
          </section>
        </aside>
      </div>
    </div>
  );
}
