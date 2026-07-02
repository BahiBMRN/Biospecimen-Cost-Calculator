import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../utils.js';

const TIERED_COLOR = '#70e1ff';
const FLAT_COLOR = '#9a7cff';
const TIERED_ZONE_FILL = 'rgba(112, 225, 255, 0.14)';
const FLAT_ZONE_FILL = 'rgba(154, 124, 255, 0.14)';

function PivotTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const tieredEntry = payload.find((entry) => entry.dataKey === 'tiered');
  const flatEntry = payload.find((entry) => entry.dataKey === 'flat');

  return (
    <div className="chart-tooltip">
      <strong>{Number(label).toFixed(0)}% Screen Positivity</strong>
      {tieredEntry && <div>Tiered: {formatCurrency(tieredEntry.value)}</div>}
      {flatEntry && <div>Flat: {formatCurrency(flatEntry.value)}</div>}
    </div>
  );
}

export default function PivotChart({ series, pivotRate, pivotKind, currentPositivity, recommendation }) {
  const flatCost = series[0]?.flat ?? 0;

  const showPivotMarkers = pivotKind === 'normal';
  const isTieredAlways = pivotKind === 'tiered-always' || (pivotKind === 'no-downstream' && recommendation === 'tiered');
  const isFlatAlways = pivotKind === 'flat-always' || (pivotKind === 'no-downstream' && recommendation === 'flat');
  const wholeDomainWinner = isTieredAlways ? 'tiered' : isFlatAlways ? 'flat' : null;

  return (
    <div className="chart-block pivot-chart-block">
      <h3>Tiered vs. Flat Cost by Screen Positivity</h3>
      <div className="bar-area">
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
          <LineChart data={series} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
            <XAxis
              dataKey="positivity"
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#aeb9d6', fontSize: 12 }}
              label={{ value: 'Screen Positivity %', position: 'insideBottom', offset: -4, fill: '#aeb9d6', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fill: '#aeb9d6', fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<PivotTooltip />} />

            {showPivotMarkers && (
              <>
                <ReferenceArea x1={0} x2={pivotRate} fill={TIERED_ZONE_FILL} strokeOpacity={0}
                  label={{ value: 'Tiered cheaper', position: 'insideTopLeft', fill: TIERED_COLOR, fontSize: 11, fontWeight: 700 }} />
                <ReferenceArea x1={pivotRate} x2={100} fill={FLAT_ZONE_FILL} strokeOpacity={0}
                  label={{ value: 'Flat cheaper', position: 'insideTopRight', fill: FLAT_COLOR, fontSize: 11, fontWeight: 700 }} />
                <ReferenceLine x={pivotRate} stroke="#eef3ff" strokeDasharray="4 4"
                  label={{ value: `Pivot ${pivotRate.toFixed(1)}%`, position: 'top', fill: '#eef3ff', fontSize: 12, fontWeight: 700 }} />
                <ReferenceDot x={pivotRate} y={flatCost} r={5} fill="#eef3ff" stroke="none" />
              </>
            )}

            {wholeDomainWinner === 'tiered' && (
              <ReferenceArea x1={0} x2={100} fill={TIERED_ZONE_FILL} strokeOpacity={0}
                label={{ value: 'Tiered cheaper at all positivity rates', position: 'insideTopLeft', fill: TIERED_COLOR, fontSize: 11, fontWeight: 700 }} />
            )}
            {wholeDomainWinner === 'flat' && (
              <ReferenceArea x1={0} x2={100} fill={FLAT_ZONE_FILL} strokeOpacity={0}
                label={{ value: 'Flat cheaper at all positivity rates', position: 'insideTopLeft', fill: FLAT_COLOR, fontSize: 11, fontWeight: 700 }} />
            )}

            <ReferenceLine
              x={currentPositivity}
              stroke="#ffd166"
              strokeDasharray="3 3"
              label={{ value: 'Now', position: 'top', fill: '#ffd166', fontSize: 12, fontWeight: 700 }}
            />

            <Line type="monotone" dataKey="tiered" name="Tiered" stroke={TIERED_COLOR} strokeWidth={3} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="flat" name="Flat" stroke={FLAT_COLOR} strokeWidth={3} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
