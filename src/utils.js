export function formatNumber(v) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(v));
}

export function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(v));
}

export function formatCurrencyWhole(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(v));
}

export function getScoreValueFontSize(formattedStr) {
  const len = formattedStr.length;
  if (len <= 8) return 'clamp(3.5rem, 5vw, 5.5rem)';
  if (len <= 11) return 'clamp(2.6rem, 4vw, 4rem)';
  if (len <= 14) return 'clamp(1.9rem, 3vw, 3rem)';
  return 'clamp(1.4rem, 2.5vw, 2.4rem)';
}

export function formatSignedCurrency(v) {
  const numeric = Number(v);
  if (numeric === 0) {
    return formatCurrency(0);
  }
  return `${numeric > 0 ? '+' : '-'}${formatCurrency(Math.abs(numeric))}`;
}

export function formatSignedCurrencyWhole(v) {
  const numeric = Number(v);
  if (numeric === 0) {
    return formatCurrencyWhole(0);
  }
  return `${numeric > 0 ? '+' : '-'}${formatCurrencyWhole(Math.abs(numeric))}`;
}

export function formatSignedPercent(v) {
  if (!Number.isFinite(Number(v))) {
    return 'N/A';
  }

  const numeric = Number(v);
  if (numeric === 0) {
    return '0.0%';
  }

  return `${numeric > 0 ? '+' : '-'}${Math.abs(numeric).toFixed(1)}%`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function ceilDiv(a, b) {
  return Math.ceil(Number(a) / Number(b));
}

export function categoryClass(group) {
  return group
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
