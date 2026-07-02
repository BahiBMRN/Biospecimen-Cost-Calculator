import { useState } from 'react';
import { GROUP_ABBREV, SCENARIO_LABELS, SCENARIO_META } from '../constants.js';
import { categoryClass } from '../utils.js';
import { buildScenarioExportModel } from '../export/exportModel.js';
import { exportToExcel } from '../export/excelExport.js';
import { exportNodeToPng } from '../export/imageExport.js';
import CostComposition from '../components/CostComposition.jsx';
import DeltaComparisonChart from '../components/DeltaComparisonChart.jsx';
import ExpeditePanel from '../components/ExpeditePanel.jsx';
import ExportToolbar from '../components/ExportToolbar.jsx';
import NumberControl from '../components/NumberControl.jsx';
import RegionPanel from '../components/RegionPanel.jsx';

function SavePresetRow({ onSavePreset }) {
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');

  if (!onSavePreset) {
    return null;
  }

  const confirmSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onSavePreset(trimmed);
    setName('');
    setShowInput(false);
  };

  if (!showInput) {
    return (
      <button type="button" className="save-preset-row-btn" onClick={() => setShowInput(true)}>
        Save current as preset
      </button>
    );
  }

  return (
    <div className="export-toolbar-preset-input">
      <input
        type="text"
        placeholder="Preset name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            confirmSave();
          }
        }}
      />
      <button type="button" onClick={confirmSave}>Confirm</button>
      <button type="button" onClick={() => { setShowInput(false); setName(''); }}>Cancel</button>
    </div>
  );
}

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
  onPatchScenario,
  onSavePreset,
  customPresets,
  applyCustomPreset,
  removeCustomPreset,
}) {
  const handleExportExcel = () => {
    const model = buildScenarioExportModel(lockedResult, scenarioResult, effectiveScenarioInputs, activeScenario);
    exportToExcel(model, 'bslcc-scenario.xlsx');
  };

  const handleExportImage = () => {
    exportNodeToPng('scenarioCaptureRoot', 'bslcc-scenario.png');
  };

  return (
    <div className="shell">
      <section className="hero">
        <h1>What-If Scenarios</h1>
        <p className="sub">
          <span className="hero-dot" />
          Select a predefined scenario or fine-tune study and sample levers to see impact on total costs
          <span className="hero-dot" style={{ marginRight: 0, marginLeft: 10 }} />
        </p>
        <ExportToolbar
          onExcel={handleExportExcel}
          onImage={handleExportImage}
          onSavePreset={onSavePreset ? (name) => onSavePreset(name, effectiveScenarioInputs) : undefined}
        />
      </section>

      <div className="layout scenario-layout">
        <aside id="scenarioLeftSidebar">
          <div className="panel" id="scenarioStudyLeversPanel">
            <div className="controls">
              <details className="accordion scenario-study-levers" open>
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
                  <RegionPanel inputs={effectiveScenarioInputs} onPatch={onPatchScenario} />
                  <ExpeditePanel inputs={effectiveScenarioInputs} onPatch={onPatchScenario} />
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
          <div className="panel" id="scenarioBtnPanel">
            <div className="controls">
              <details className="accordion scenario-list-accordion">
                <summary>
                  <span className="scenario-heading">Presets</span>
                </summary>
                <div className="accordion-content">
                  <div className="button-row scenario-buttons">
                    <SavePresetRow onSavePreset={onSavePreset ? (name) => onSavePreset(name, effectiveScenarioInputs) : null} />
                    {Object.keys(SCENARIO_LABELS).map((scenario) => (
                      <button
                        key={scenario}
                        className={activeScenario === scenario ? 'active' : ''}
                        onClick={() => applyScenario(scenario)}
                      >
                        {SCENARIO_LABELS[scenario]}
                      </button>
                    ))}
                    {customPresets && customPresets.length > 0 && customPresets.map((preset) => (
                      <div className="custom-preset-row" key={preset.id}>
                        <button
                          className={`custom-preset-btn${activeScenario === `custom:${preset.id}` ? ' active' : ''}`}
                          onClick={() => applyCustomPreset(preset)}
                        >
                          <span className="custom-preset-tag">Custom</span>
                          {preset.name}
                        </button>
                        <button
                          type="button"
                          className="custom-preset-delete-btn"
                          onClick={() => removeCustomPreset(preset.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          </div>
        </aside>

        <main className="main-grid">
          <div className="scenario-results-stack" id="scenarioCaptureRoot">
            <CostComposition result={lockedResult} variant="locked" />
            <section className="panel scenario-assumptions-panel assumptions assumptions-compact">
              {activeScenario && activeScenario.startsWith('custom:') ? (
                <>
                  <div className="assump-title">
                    Custom Preset: {customPresets?.find((p) => `custom:${p.id}` === activeScenario)?.name ?? 'Unnamed'}
                  </div>
                  <div className="mini dim">This view reflects your saved custom preset lever values.</div>
                </>
              ) : activeScenario ? (
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
            <DeltaComparisonChart
              baselineResult={lockedResult}
              scenarioResult={scenarioResult}
              footer={(
                <button
                  type="button"
                  className="reset-scenario-btn scenario-delta-reset-btn"
                  onClick={resetScenarioToLocked}
                >
                  Reset
                </button>
              )}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
