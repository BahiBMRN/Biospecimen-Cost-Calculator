import { describe, expect, test } from 'vitest';
import { buildPivotSeries, calculateTieredAssay } from './calculate.js';

describe('calculateTieredAssay', () => {
  test('tiered per-sample cost matches sc + p*cc + p*q*tc', () => {
    const result = calculateTieredAssay({
      screenCost: 15,
      confirmCost: 120,
      titerCost: 180,
      screenTat: 3,
      confirmTat: 7,
      titerTat: 10,
      screenPosPct: 15,
      confirmPosPct: 60,
      flatAssayCost: 80,
      flatTat: 12,
      totalSamples: '',
    });

    expect(result.tieredPerSample).toBeCloseTo(49.2, 6); // 15 + 18 + 16.2
    expect(result.flatPerSample).toBe(80);
  });

  describe('normal pivot (0 <= pStar <= 1)', () => {
    // sc=10, cc=100, tc=0, flat=50, q=1 -> denom=100, pStar=(50-10)/100=0.4 -> pivotRate=40
    const baseParams = {
      screenCost: 10,
      confirmCost: 100,
      titerCost: 0,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      confirmPosPct: 100,
      flatAssayCost: 50,
      flatTat: 1,
      totalSamples: '',
    };

    test('computes pivotRate=40 and pivotKind="normal"', () => {
      const result = calculateTieredAssay({ ...baseParams, screenPosPct: 15 });
      expect(result.pivotKind).toBe('normal');
      expect(result.pivotRate).toBeCloseTo(40, 6);
    });

    test('recommends tiered below the pivot rate', () => {
      const result = calculateTieredAssay({ ...baseParams, screenPosPct: 20 });
      expect(result.recommendation).toBe('tiered');
    });

    test('recommends flat above the pivot rate', () => {
      const result = calculateTieredAssay({ ...baseParams, screenPosPct: 60 });
      expect(result.recommendation).toBe('flat');
    });

    test('recommends equal exactly at the pivot rate', () => {
      const result = calculateTieredAssay({ ...baseParams, screenPosPct: 40 });
      expect(result.recommendation).toBe('equal');
      expect(result.tieredPerSample).toBeCloseTo(result.flatPerSample, 6);
    });
  });

  test('flat-always: screen cost alone exceeds flat cost -> pivotRate=0, recommend flat', () => {
    // sc=100, cc=10, tc=10, q=0.5 -> denom=15, pStar=(50-100)/15 < 0
    const result = calculateTieredAssay({
      screenCost: 100,
      confirmCost: 10,
      titerCost: 10,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 1,
      confirmPosPct: 50,
      flatAssayCost: 50,
      flatTat: 1,
      totalSamples: '',
    });

    expect(result.pivotKind).toBe('flat-always');
    expect(result.pivotRate).toBe(0);
    expect(result.recommendation).toBe('flat');
  });

  test('tiered-always: tiered stays cheaper even at 100% positivity -> pivotRate=100, recommend tiered', () => {
    // sc=5, cc=10, tc=10, q=0.5 -> denom=15, tiered(p=1)=5+10+5=20, flat=1000 -> pStar=(1000-5)/15 > 1
    const result = calculateTieredAssay({
      screenCost: 5,
      confirmCost: 10,
      titerCost: 10,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 100,
      confirmPosPct: 50,
      flatAssayCost: 1000,
      flatTat: 1,
      totalSamples: '',
    });

    expect(result.pivotKind).toBe('tiered-always');
    expect(result.pivotRate).toBe(100);
    expect(result.recommendation).toBe('tiered');
  });

  describe('no-downstream (denom <= 0)', () => {
    test('confirmCost=0 and titerCost=0 -> pivotRate=null, recommend tiered when screen < flat', () => {
      const result = calculateTieredAssay({
        screenCost: 15,
        confirmCost: 0,
        titerCost: 0,
        screenTat: 1,
        confirmTat: 1,
        titerTat: 1,
        screenPosPct: 50,
        confirmPosPct: 50,
        flatAssayCost: 80,
        flatTat: 1,
        totalSamples: '',
      });

      expect(result.pivotKind).toBe('no-downstream');
      expect(result.pivotRate).toBeNull();
      expect(result.recommendation).toBe('tiered');
    });

    test('recommend flat when screen cost > flat cost', () => {
      const result = calculateTieredAssay({
        screenCost: 100,
        confirmCost: 0,
        titerCost: 0,
        screenTat: 1,
        confirmTat: 1,
        titerTat: 1,
        screenPosPct: 50,
        confirmPosPct: 50,
        flatAssayCost: 80,
        flatTat: 1,
        totalSamples: '',
      });

      expect(result.pivotKind).toBe('no-downstream');
      expect(result.recommendation).toBe('flat');
    });

    test('confirmPosPct=0 (q=0) with nonzero titerCost also yields no-downstream', () => {
      const result = calculateTieredAssay({
        screenCost: 15,
        confirmCost: 0,
        titerCost: 50,
        screenTat: 1,
        confirmTat: 1,
        titerTat: 1,
        screenPosPct: 50,
        confirmPosPct: 0,
        flatAssayCost: 80,
        flatTat: 1,
        totalSamples: '',
      });

      expect(result.pivotKind).toBe('no-downstream');
      expect(result.recommendation).toBe('tiered');
    });
  });

  test('all-zero costs: no crash, recommendation is "equal"', () => {
    const result = calculateTieredAssay({
      screenCost: 0,
      confirmCost: 0,
      titerCost: 0,
      screenTat: 0,
      confirmTat: 0,
      titerTat: 0,
      screenPosPct: 0,
      confirmPosPct: 0,
      flatAssayCost: 0,
      flatTat: 0,
      totalSamples: '',
    });

    expect(result.tieredPerSample).toBe(0);
    expect(result.flatPerSample).toBe(0);
    expect(result.recommendation).toBe('equal');
    expect(Number.isFinite(result.tieredPerSample)).toBe(true);
  });

  test('percent vs fraction guard: screenPosPct=50 behaves as 0.5, not 50', () => {
    const result = calculateTieredAssay({
      screenCost: 0,
      confirmCost: 100,
      titerCost: 0,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 50,
      confirmPosPct: 100,
      flatAssayCost: 999,
      flatTat: 1,
      totalSamples: '',
    });

    expect(result.tieredPerSample).toBeCloseTo(50, 6); // 0 + 0.5*100, NOT 0 + 50*100
  });

  test('cascade counts scale correctly with totalSamples, and are null when totalSamples is empty/zero', () => {
    const withTotal = calculateTieredAssay({
      screenCost: 15,
      confirmCost: 120,
      titerCost: 180,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 15,
      confirmPosPct: 60,
      flatAssayCost: 80,
      flatTat: 1,
      totalSamples: 1000,
    });

    expect(withTotal.counts).toEqual({ screened: 1000, screenPos: 150, confirmPos: 90, titered: 90 });
    expect(withTotal.tieredTotal).toBeCloseTo(49.2 * 1000, 6);
    expect(withTotal.flatTotal).toBeCloseTo(80 * 1000, 6);

    const emptyTotal = calculateTieredAssay({
      screenCost: 15,
      confirmCost: 120,
      titerCost: 180,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 15,
      confirmPosPct: 60,
      flatAssayCost: 80,
      flatTat: 1,
      totalSamples: '',
    });
    expect(emptyTotal.counts).toBeNull();
    expect(emptyTotal.tieredTotal).toBeNull();
    expect(emptyTotal.flatTotal).toBeNull();

    const zeroTotal = calculateTieredAssay({
      screenCost: 15,
      confirmCost: 120,
      titerCost: 180,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 15,
      confirmPosPct: 60,
      flatAssayCost: 80,
      flatTat: 1,
      totalSamples: 0,
    });
    expect(zeroTotal.counts).toBeNull();
  });

  test('turnaround comparison: tieredTatWorst = screen+confirm+titer, tatDelta = tieredTatWorst - flatTat', () => {
    const result = calculateTieredAssay({
      screenCost: 15,
      confirmCost: 120,
      titerCost: 180,
      screenTat: 3,
      confirmTat: 7,
      titerTat: 10,
      screenPosPct: 15,
      confirmPosPct: 60,
      flatAssayCost: 80,
      flatTat: 12,
      totalSamples: '',
    });

    expect(result.tieredTatWorst).toBe(20);
    expect(result.flatTatValue).toBe(12);
    expect(result.tatDelta).toBe(8);
  });

  test('clamps out-of-range positivity percentages into [0, 100]', () => {
    const overHigh = calculateTieredAssay({
      screenCost: 0,
      confirmCost: 100,
      titerCost: 0,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 150,
      confirmPosPct: 200,
      flatAssayCost: 999,
      flatTat: 1,
      totalSamples: '',
    });
    // p and q both clamp to 1 -> tiered = 0 + 1*100 + 1*1*0 = 100
    expect(overHigh.tieredPerSample).toBeCloseTo(100, 6);

    const underLow = calculateTieredAssay({
      screenCost: 5,
      confirmCost: 100,
      titerCost: 0,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: -20,
      confirmPosPct: -50,
      flatAssayCost: 999,
      flatTat: 1,
      totalSamples: '',
    });
    // p and q both clamp to 0 -> tiered = screenCost only
    expect(underLow.tieredPerSample).toBeCloseTo(5, 6);
  });
});

describe('buildPivotSeries', () => {
  test('returns 101 points by default, spanning 0-100% positivity', () => {
    const series = buildPivotSeries({ screenCost: 15, confirmCost: 120, titerCost: 180, confirmPosPct: 60, flatAssayCost: 80 });
    expect(series).toHaveLength(101);
    expect(series[0].positivity).toBe(0);
    expect(series[series.length - 1].positivity).toBe(100);
  });

  test('tiered value at positivity=0 equals screenCost', () => {
    const series = buildPivotSeries({ screenCost: 15, confirmCost: 120, titerCost: 180, confirmPosPct: 60, flatAssayCost: 80 });
    expect(series[0].tiered).toBeCloseTo(15, 6);
  });

  test('flat value is constant across the whole series', () => {
    const series = buildPivotSeries({ screenCost: 15, confirmCost: 120, titerCost: 180, confirmPosPct: 60, flatAssayCost: 80 });
    expect(series.every((point) => point.flat === 80)).toBe(true);
  });

  test('crossover index matches the pivot rate computed by calculateTieredAssay', () => {
    const params = { screenCost: 10, confirmCost: 100, titerCost: 0, confirmPosPct: 100, flatAssayCost: 50 };
    const series = buildPivotSeries(params);
    const analysis = calculateTieredAssay({
      ...params,
      screenTat: 1,
      confirmTat: 1,
      titerTat: 1,
      screenPosPct: 0,
      flatTat: 1,
      totalSamples: '',
    });

    const crossoverPoint = series.find((point) => point.tiered >= point.flat);
    expect(crossoverPoint.positivity).toBeCloseTo(analysis.pivotRate, 0);
  });
});
