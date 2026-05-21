import { formatCurrency } from '../utils.js';

export default function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{row.label}</strong>
      <div>{formatCurrency(row.value)}</div>
      <div>{row.percent.toFixed(0)}%</div>
    </div>
  );
}
