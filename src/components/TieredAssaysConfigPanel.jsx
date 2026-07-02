function TierRow({ label, costLabel, tatLabel, costKey, tatKey, inputs, onPatch }) {
  return (
    <div className="sd-option-section">
      <div className="sd-option-row-label">{label}</div>
      <div className="control">
        <div className="control-header">
          <label htmlFor={costKey}>{costLabel}</label>
          <div className="control-input-group">
            <input
              type="number"
              id={costKey}
              min={0}
              step={1}
              value={inputs[costKey]}
              onChange={(event) => onPatch({ [costKey]: event.target.value === '' ? 0 : Number(event.target.value) })}
            />
          </div>
        </div>
      </div>
      <div className="control">
        <div className="control-header">
          <label htmlFor={tatKey}>{tatLabel}</label>
          <div className="control-input-group">
            <input
              type="number"
              id={tatKey}
              min={0}
              step={1}
              value={inputs[tatKey]}
              onChange={(event) => onPatch({ [tatKey]: event.target.value === '' ? 0 : Number(event.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TieredAssaysConfigPanel({ inputs, onPatch, onReset }) {
  return (
    <div className="panel">
      <div className="head">
        <h3 className="lever-heading">Tiered Assay Configuration</h3>
        <button type="button" className="reset-scenario-btn" onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="controls">
        <TierRow
          label="Screen"
          costLabel="Screen Assay Cost per Sample ($)"
          tatLabel="Screen Turnaround (days)"
          costKey="screenCost"
          tatKey="screenTat"
          inputs={inputs}
          onPatch={onPatch}
        />
        <TierRow
          label="Confirm"
          costLabel="Confirm Assay Cost per Sample ($)"
          tatLabel="Confirm Turnaround (days)"
          costKey="confirmCost"
          tatKey="confirmTat"
          inputs={inputs}
          onPatch={onPatch}
        />
        <TierRow
          label="Titer"
          costLabel="Titer Assay Cost per Sample ($)"
          tatLabel="Titer Turnaround (days)"
          costKey="titerCost"
          tatKey="titerTat"
          inputs={inputs}
          onPatch={onPatch}
        />

        <div className="sd-option-section">
          <div className="sd-option-row-label">Positivity Rates</div>
          <div className="control">
            <div className="control-header">
              <label htmlFor="currentScreenPosPct">Expected Screen Positivity Rate (%)</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="currentScreenPosPct"
                  min={0}
                  max={100}
                  step={1}
                  value={inputs.currentScreenPosPct}
                  onChange={(event) => onPatch({ currentScreenPosPct: event.target.value === '' ? 0 : Number(event.target.value) })}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={inputs.currentScreenPosPct}
              onChange={(event) => onPatch({ currentScreenPosPct: Number(event.target.value) })}
            />
          </div>
          <div className="control">
            <div className="control-header">
              <label htmlFor="confirmPosPct">Confirm Positivity Rate (%)</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="confirmPosPct"
                  min={0}
                  max={100}
                  step={1}
                  value={inputs.confirmPosPct}
                  onChange={(event) => onPatch({ confirmPosPct: event.target.value === '' ? 0 : Number(event.target.value) })}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={inputs.confirmPosPct}
              onChange={(event) => onPatch({ confirmPosPct: Number(event.target.value) })}
            />
          </div>
        </div>

        <div className="sd-option-section">
          <div className="sd-option-row-label">Flat Assay Comparison</div>
          <div className="control">
            <div className="control-header">
              <label htmlFor="flatAssayCost">Flat Assay Cost per Sample ($)</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="flatAssayCost"
                  min={0}
                  step={1}
                  value={inputs.flatAssayCost}
                  onChange={(event) => onPatch({ flatAssayCost: event.target.value === '' ? 0 : Number(event.target.value) })}
                />
              </div>
            </div>
          </div>
          <div className="control">
            <div className="control-header">
              <label htmlFor="flatTat">Flat Assay Turnaround (days)</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="flatTat"
                  min={0}
                  step={1}
                  value={inputs.flatTat}
                  onChange={(event) => onPatch({ flatTat: event.target.value === '' ? 0 : Number(event.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sd-option-section">
          <div className="sd-option-row-label">Study Volume</div>
          <div className="control">
            <div className="control-header">
              <label htmlFor="tieredTotalSamples">Total Number of Expected Samples</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="tieredTotalSamples"
                  min={0}
                  step={1}
                  placeholder="Optional"
                  value={inputs.totalSamples}
                  onChange={(event) => onPatch({ totalSamples: event.target.value === '' ? '' : Number(event.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
