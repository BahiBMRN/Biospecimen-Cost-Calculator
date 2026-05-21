import { formatCurrency, formatSignedCurrency, formatSignedCurrencyWhole } from '../utils.js';
import { GROUP_ABBREV } from '../constants.js';

export default function DeltaComparisonChart({ baselineResult, scenarioResult }) {
  const abbrevs = ['K', 'L', 'T', 'S', 'D'];
  const colorByAbbrev = (() => {
    const map = {};
    if (Array.isArray(baselineResult.segments)) {
      for (const seg of baselineResult.segments) {
        const abbr = GROUP_ABBREV[seg.label];
        if (abbr && !(abbr in map)) {
          map[abbr] = seg.color;
        }
      }
    }
    return map;
  })();

  const componentRows = abbrevs.map((abbr) => {
    const baseline = baselineResult[abbr];
    const scenario = scenarioResult[abbr];
    const color = colorByAbbrev[abbr] ?? '#e9efff';
    return { label: abbr, baseline, scenario, color, delta: scenario - baseline };
  });

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
