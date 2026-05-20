import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { GROUP_ABBREV } from '../constants.js';
import { formatCurrency, formatCurrencyWhole, formatNumber, getScoreValueFontSize } from '../utils.js';
import DonutTooltip from './DonutTooltip.jsx';

export default function CostComposition({ result, variant = 'default', showLockButton = false, onLockIn }) {
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
          <div className="score-label">{isCalculatorView ? 'TOTAL COLLECTION STUDY COST' : 'Cost per sample'}</div>
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
