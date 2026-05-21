import { useEffect, useState } from 'react';
import { SD_CONTAINER_SIZES, SD_FIXED_RATES, SD_SAMPLE_TYPES, SD_STORAGE_TEMPS } from '../constants.js';
import { formatCurrency, formatCurrencyWhole } from '../utils.js';

function CostTile({ label, value, isTotal }) {
  return (
    <div className={`sd-cost-tile${isTotal ? ' sd-cost-tile--total' : ''}`}>
      <div className="sd-cost-tile-label">{label}</div>
      <div className="sd-cost-tile-value">
        {value != null ? (isTotal ? formatCurrencyWhole(value) : formatCurrency(value)) : <span className="sd-cost-tile-empty">—</span>}
      </div>
    </div>
  );
}

function FormulaLine({ children }) {
  return <div className="sd-formula-line">{children}</div>;
}

// ── Store Output ──────────────────────────────────────────────────────────────
function StoreOutput({ storeInputs, storeResult }) {
  const { sampleType, containerSize, storageTemp, storageDuration, totalSamples } = storeInputs;
  const { perSample, totalStudy, storageRate } = storeResult;

  const sampleTypeLabel = SD_SAMPLE_TYPES.find((t) => t.key === sampleType)?.label;
  const containerLabel = SD_CONTAINER_SIZES.find((c) => c.key === containerSize)?.label;
  const tempLabel = SD_STORAGE_TEMPS.find((t) => t.key === storageTemp)?.label;
  const hasTotal = totalSamples !== '' && Number(totalSamples) > 0;

  return (
    <>
      <div className="sd-output-section">
        <div className="sd-output-section-title">Selection Summary</div>
        <ul className="sd-summary-list">
          {sampleTypeLabel && <li><span className="sd-summary-key">Sample Type:</span> {sampleTypeLabel}</li>}
          {containerLabel  && <li><span className="sd-summary-key">Container Size:</span> {containerLabel}</li>}
          {tempLabel       && <li><span className="sd-summary-key">Storage Temp:</span> {tempLabel}</li>}
          {(storageDuration > 0 || containerSize) && (
            <li><span className="sd-summary-key">Duration:</span> {storageDuration} months</li>
          )}
          {hasTotal && <li><span className="sd-summary-key">Total Samples:</span> {Number(totalSamples).toLocaleString()}</li>}
        </ul>
      </div>

      <div className="sd-output-section">
        <div className="sd-output-section-title">Formula</div>
        <div className="sd-formula-display">
          {storageRate != null ? (
            <>
              <FormulaLine>Registration + (Storage Rate × Duration)</FormulaLine>
              <FormulaLine>
                {formatCurrency(SD_FIXED_RATES.registration)} + ({formatCurrency(storageRate)}/mo × {storageDuration} mo)
              </FormulaLine>
              <FormulaLine className="sd-formula-result">
                = <strong>{perSample != null ? formatCurrency(perSample) : '—'} / sample</strong>
              </FormulaLine>
            </>
          ) : (
            <span className="sd-validation-msg">Select container size and storage temperature to see the formula.</span>
          )}
        </div>
      </div>

      <div className="sd-cost-tiles">
        <CostTile label="Cost Per Sample" value={perSample} />
        <CostTile label="Total Study Cost" value={hasTotal ? totalStudy : null} isTotal />
      </div>
      {!hasTotal && (
        <p className="sd-validation-msg sd-validation-msg--hint">Enter total samples to calculate total study cost.</p>
      )}
    </>
  );
}

// ── Dispose Output ────────────────────────────────────────────────────────────
function DisposeOutput({ disposeInputs, disposeResult }) {
  const { sampleType, containerSize, totalSamples } = disposeInputs;
  const { perSample, totalStudy } = disposeResult;

  const sampleTypeLabel = SD_SAMPLE_TYPES.find((t) => t.key === sampleType)?.label;
  const containerLabel = SD_CONTAINER_SIZES.find((c) => c.key === containerSize)?.label;
  const hasTotal = totalSamples !== '' && Number(totalSamples) > 0;

  return (
    <>
      <div className="sd-output-section">
        <div className="sd-output-section-title">Selection Summary</div>
        <ul className="sd-summary-list">
          {sampleTypeLabel && <li><span className="sd-summary-key">Sample Type:</span> {sampleTypeLabel}</li>}
          {containerLabel  && <li><span className="sd-summary-key">Container Size:</span> {containerLabel} <span className="sd-muted">(informational)</span></li>}
          {hasTotal && <li><span className="sd-summary-key">Total Samples:</span> {Number(totalSamples).toLocaleString()}</li>}
        </ul>
      </div>

      <div className="sd-output-section">
        <div className="sd-output-section-title">Formula</div>
        <div className="sd-formula-display">
          <FormulaLine>Registration Rate + Disposal Rate</FormulaLine>
          <FormulaLine>
            {formatCurrency(SD_FIXED_RATES.registration)} + {formatCurrency(SD_FIXED_RATES.disposal)}
          </FormulaLine>
          <FormulaLine>= <strong>{formatCurrency(perSample)} / sample</strong></FormulaLine>
        </div>
      </div>

      <div className="sd-cost-tiles">
        <CostTile label="Cost Per Sample" value={perSample} />
        <CostTile label="Total Study Cost" value={hasTotal ? totalStudy : null} isTotal />
      </div>
      {!hasTotal && (
        <p className="sd-validation-msg sd-validation-msg--hint">Enter total samples to calculate total study cost.</p>
      )}
    </>
  );
}

// ── Store & Dispose Output ────────────────────────────────────────────────────
function StoreAndDisposeOutput({ storeInputs, disposeInputs, sdResult }) {
  const { perSample, totalStudy, storagePortion, disposalPortion, storageRate } = sdResult;

  const storeComplete = storeInputs.containerSize && storeInputs.storageTemp && storeInputs.storageDuration > 0;
  const disposeComplete = disposeInputs.containerSize;

  const hasTotal = (storeInputs.totalSamples !== '' && Number(storeInputs.totalSamples) > 0) ||
                   (disposeInputs.totalSamples !== '' && Number(disposeInputs.totalSamples) > 0);

  const totalSamplesVal = Number(storeInputs.totalSamples) || Number(disposeInputs.totalSamples) || 0;
  const containerLabel = SD_CONTAINER_SIZES.find((c) => c.key === storeInputs.containerSize)?.label;
  const tempLabel = SD_STORAGE_TEMPS.find((t) => t.key === storeInputs.storageTemp)?.label;

  if (!storeComplete || !disposeComplete) {
    return (
      <div className="sd-validation-block">
        <p className="sd-validation-msg">Configure Store &amp; Dispose costs to get a combined total.</p>
        <ul className="sd-validation-checklist">
          <li className={storeInputs.containerSize ? 'done' : ''}>Store: Container Size</li>
          <li className={storeInputs.storageTemp ? 'done' : ''}>Store: Storage Temperature</li>
          <li className={storeInputs.storageDuration > 0 ? 'done' : ''}>Store: Storage Duration &gt; 0</li>
          <li className={disposeInputs.containerSize ? 'done' : ''}>Dispose: Container Size</li>
        </ul>
      </div>
    );
  }

  return (
    <>
      <div className="sd-output-section">
        <div className="sd-output-section-title">Configuration Summary</div>
        <ul className="sd-summary-list">
          {containerLabel && <li><span className="sd-summary-key">Container Size:</span> {containerLabel}</li>}
          {tempLabel      && <li><span className="sd-summary-key">Storage Temp:</span> {tempLabel}</li>}
          <li><span className="sd-summary-key">Duration:</span> {storeInputs.storageDuration} months</li>
          {hasTotal && <li><span className="sd-summary-key">Total Samples:</span> {totalSamplesVal.toLocaleString()}</li>}
        </ul>
      </div>

      <div className="sd-output-section">
        <div className="sd-output-section-title">Formula</div>
        <div className="sd-formula-display">
          <FormulaLine><strong>Storage:</strong> Registration + (Rate × Duration)</FormulaLine>
          <FormulaLine>
            {formatCurrency(SD_FIXED_RATES.registration)} + ({storageRate != null ? formatCurrency(storageRate) : '—'}/mo × {storeInputs.storageDuration} mo)
            {' '}= <strong>{storagePortion != null ? formatCurrency(storagePortion) : '—'}</strong>
          </FormulaLine>
          <FormulaLine><strong>Disposal:</strong> Retrieval Rate + Disposal Rate</FormulaLine>
          <FormulaLine>
            {formatCurrency(SD_FIXED_RATES.retrieval)} + {formatCurrency(SD_FIXED_RATES.disposal)}
            {' '}= <strong>{formatCurrency(disposalPortion)}</strong>
          </FormulaLine>
          <FormulaLine className="sd-formula-result">
            Combined = <strong>{perSample != null ? formatCurrency(perSample) : '—'} / sample</strong>
          </FormulaLine>
        </div>
        <p className="sd-muted" style={{ fontSize: '0.82rem', marginTop: 6 }}>
          Registration applies once at storage receipt; Retrieval applies at disposal.
        </p>
      </div>

      <div className="sd-cost-tiles">
        <CostTile label="Cost Per Sample" value={perSample} />
        <CostTile label="Total Study Cost" value={hasTotal ? totalStudy : null} isTotal />
      </div>
      {!hasTotal && (
        <p className="sd-validation-msg sd-validation-msg--hint">Enter total samples in either Store or Dispose tab to calculate total study cost.</p>
      )}
    </>
  );
}

// ── Main Output Panel ─────────────────────────────────────────────────────────
export default function SDOutputPanel({ activeSDTab, storeInputs, disposeInputs, storeResult, disposeResult, sdResult }) {
  const [showCombined, setShowCombined] = useState(false);

  useEffect(() => {
    setShowCombined(false);
  }, [activeSDTab]);

  return (
    <div className="panel sd-output-panel">
      <div className="sd-output-header">
        <div className="sd-output-title">Calculated Cost</div>
      </div>
      <div className="sd-output-body">
        {activeSDTab === 'store' && (
          <StoreOutput storeInputs={storeInputs} storeResult={storeResult} />
        )}
        {activeSDTab === 'dispose' && (
          <DisposeOutput disposeInputs={disposeInputs} disposeResult={disposeResult} />
        )}
        {activeSDTab === 'storeAndDispose' && (
          <>
            <button
              type="button"
              className={`sd-combined-btn${showCombined ? ' active' : ''}`}
              onClick={() => setShowCombined((v) => !v)}
            >
              Store AND Dispose?
            </button>
            {showCombined && (
              <StoreAndDisposeOutput storeInputs={storeInputs} disposeInputs={disposeInputs} sdResult={sdResult} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
