import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GROUP_ABBREV } from '../constants.js';
import { formatCurrency, formatCurrencyWhole } from '../utils.js';

export default function BreakdownChart({ segments, N_samples }) {
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  return (
    <div className="chart-block">
      <h3>Cost Breakdown</h3>
      <div className="bar-area">
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" width={160} tick={{ fill: '#aeb9d6', fontSize: 20 }} tickFormatter={(label) => `${label} (${GROUP_ABBREV[label] ?? label})`} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const { label, value } = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <strong>{label}</strong>
                    <div>Per Sample: {formatCurrency(value)}</div>
                    <div>Total Study: {formatCurrencyWhole(value * N_samples)}</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 8, 8]}>
              {sorted.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
