import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TIERED_DEFAULTS } from '../constants.js';
import { buildPivotSeries, calculateTieredAssay } from '../calculate.js';
import { formatCurrency, formatCurrencyWhole, formatNumber } from '../utils.js';
import { buildTieredExportModel } from '../export/exportModel.js';
import { exportToExcel } from '../export/excelExport.js';
import { exportNodeToPng } from '../export/imageExport.js';
import TieredAssaysConfigPanel from '../components/TieredAssaysConfigPanel.jsx';
import PivotChart from '../components/PivotChart.jsx';
import ExportToolbar from '../components/ExportToolbar.jsx';

const PIVOT_MESSAGES = {
  normal: (rate) => `Pivot at ${rate.toFixed(1)}% screen positivity`,
  'flat-always': () => 'Flat cheaper at all positivity rates',
  'tiered-always': () => 'Tiered cheaper at all positivity rates',
  'no-downstream': () => 'No downstream cost — compare screen vs flat',
};

const RECOMMENDATION_LABELS = {
  tiered: 'Tiered',
  flat: 'Flat',
  equal: 'Either',
};

export default function TieredAssaysView({ headerActionsNode }) {
  const [inputs, setInputs] = useState(TIERED_DEFAULTS);

  const onPatch = (patch) => setInputs((current) => ({ ...current, ...patch }));
  const onReset = () => setInputs(TIERED_DEFAULTS);

  const analysis = useMemo(
    () => calculateTieredAssay({ ...inputs, screenPosPct: inputs.currentScreenPosPct }),
    [inputs]
  );

  const series = useMemo(
    () => buildPivotSeries({
      screenCost: inputs.screenCost,
      confirmCost: inputs.confirmCost,
      titerCost: inputs.titerCost,
      confirmPosPct: inputs.confirmPosPct,
      flatAssayCost: inputs.flatAssayCost,
    }),
    [inputs]
  );

  const hasTotal = inputs.totalSamples !== '' && Number(inputs.totalSamples) > 0;
  const pivotMessage = PIVOT_MESSAGES[analysis.pivotKind](analysis.pivotRate);
  const recommendationLabel = RECOMMENDATION_LABELS[analysis.recommendation] ?? 'Either';

  const handleExportExcel = () => {
    const model = buildTieredExportModel(inputs, analysis);
    exportToExcel(model, 'bslcc-tiered-assays.xlsx');
  };

  const handleExportImage = () => {
    exportNodeToPng('tieredCaptureRoot', 'bslcc-tiered-assays.png');
  };

  return (
    <div className="shell">
      {headerActionsNode && createPortal(
        <ExportToolbar onExcel={handleExportExcel} onImage={handleExportImage} />,
        headerActionsNode
      )}

      <section className="hero">
        <h1>Calculate the Pivot Point for Tiered Assays</h1>
        <p className="sub">
          <span className="hero-dot" />
          Compare a tiered screen/confirm/titer cascade against a flat assay and find the break-even screen-positivity rate
          <span className="hero-dot" style={{ marginRight: 0, marginLeft: 10 }} />
        </p>
      </section>

      <div className="layout" id="tieredCaptureRoot">
        <aside>
          <TieredAssaysConfigPanel inputs={inputs} onPatch={onPatch} onReset={onReset} />
        </aside>

        <main className="main-grid">
          <section className="panel">
            <PivotChart
              series={series}
              pivotRate={analysis.pivotRate}
              pivotKind={analysis.pivotKind}
              currentPositivity={inputs.currentScreenPosPct}
              recommendation={analysis.recommendation}
            />
          </section>

          <section className="panel result-card">
            <div className="sd-cost-tiles">
              <div className="sd-cost-tile">
                <div className="sd-cost-tile-label">Tiered Cost / Sample</div>
                <div className="sd-cost-tile-value">{formatCurrency(analysis.tieredPerSample)}</div>
              </div>
              <div className="sd-cost-tile">
                <div className="sd-cost-tile-label">Flat Cost / Sample</div>
                <div className="sd-cost-tile-value">{formatCurrency(analysis.flatPerSample)}</div>
              </div>
            </div>

            <div className="sd-cost-tiles pivot-summary-tiles">
              <div className="sd-cost-tile sd-cost-tile--total">
                <div className="sd-cost-tile-label">Pivot Point</div>
                <div className="sd-cost-tile-value pivot-point-value">{pivotMessage}</div>
              </div>
              <div className="sd-cost-tile sd-cost-tile--total">
                <div className="sd-cost-tile-label">Recommendation</div>
                <div className="sd-cost-tile-value">Recommended: {recommendationLabel}</div>
              </div>
            </div>

            {analysis.counts && (
              <div className="sd-output-section">
                <div className="sd-output-section-title">Cascade Counts</div>
                <ul className="sd-summary-list">
                  <li><span className="sd-summary-key">Screened:</span> {formatNumber(Math.round(analysis.counts.screened))}</li>
                  <li><span className="sd-summary-key">Screen-Positive:</span> {formatNumber(Math.round(analysis.counts.screenPos))}</li>
                  <li><span className="sd-summary-key">Confirmed-Positive / Titered:</span> {formatNumber(Math.round(analysis.counts.confirmPos))}</li>
                </ul>
              </div>
            )}

            {hasTotal && (
              <div className="sd-cost-tiles">
                <div className="sd-cost-tile sd-cost-tile--total">
                  <div className="sd-cost-tile-label">Tiered Total Study Cost</div>
                  <div className="sd-cost-tile-value">{formatCurrencyWhole(analysis.tieredTotal)}</div>
                </div>
                <div className="sd-cost-tile sd-cost-tile--total">
                  <div className="sd-cost-tile-label">Flat Total Study Cost</div>
                  <div className="sd-cost-tile-value">{formatCurrencyWhole(analysis.flatTotal)}</div>
                </div>
              </div>
            )}
            {!hasTotal && (
              <p className="sd-validation-msg sd-validation-msg--hint">Enter total samples to calculate total study cost.</p>
            )}

            <p className="sd-muted" style={{ fontSize: '0.86rem', marginTop: 6 }}>
              Tiered turnaround (worst case): {analysis.tieredTatWorst} days vs. Flat {analysis.flatTatValue} days
              {' '}({analysis.tatDelta > 0 ? '+' : ''}{analysis.tatDelta} days)
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
