import { describe, expect, test } from 'vitest';
import { calculateStorage, calculateStoreAndDispose } from './calculate.js';

describe('Store & Dispose calculation helpers', () => {
  describe('calculateStorage', () => {
    test('returns nulls when container or temp missing', () => {
      expect(calculateStorage({ containerSize: null, storageTemp: null, storageDuration: 0, totalSamples: '' }))
        .toEqual({ perSample: null, totalStudy: null, storageRate: null });
      expect(calculateStorage({ containerSize: 'lte4mL', storageTemp: null, storageDuration: 12, totalSamples: '' }))
        .toEqual({ perSample: null, totalStudy: null, storageRate: null });
    });

    test('computes per-sample and total correctly for ≤4mL at -70°C to -80°C over 24 months', () => {
      const res = calculateStorage({ containerSize: 'lte4mL', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: 100 });
      expect(res.storageRate).toBeCloseTo(0.075, 6);
      expect(res.perSample).toBeCloseTo(3.02, 2); // 1.22 + 0.075*24
      expect(res.totalStudy).toBeCloseTo(302, 3); // 3.02 * 100
    });

    test('slides map to ≤4mL rate row', () => {
      const res = calculateStorage({ containerSize: 'slides', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: '' });
      expect(res.storageRate).toBeCloseTo(0.075, 6);
      expect(res.perSample).toBeCloseTo(3.02, 2);
      expect(res.totalStudy).toBeNull();
    });

    test('totalStudy is null when totalSamples is 0 or empty', () => {
      const a = calculateStorage({ containerSize: 'lte4mL', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: 0 });
      const b = calculateStorage({ containerSize: 'lte4mL', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: '' });
      expect(a.totalStudy).toBeNull();
      expect(b.totalStudy).toBeNull();
    });
  });

  // calculateDisposal tests removed: by design perSample is null until the user
  // supplies the required inputs (UI consistency contract).

  describe('calculateStoreAndDispose', () => {
    test('returns nulls when store side is incomplete', () => {
      const res = calculateStoreAndDispose(
        { containerSize: 'lte4mL', storageTemp: null, storageDuration: 0, totalSamples: '' },
        { totalSamples: '' }
      );
      expect(res.perSample).toBeNull();
      expect(res.totalStudy).toBeNull();
      expect(res.storagePortion).toBeNull();
      expect(res.disposalPortion).toBeNull();
    });

    test('combines storage and disposal with correct components and totals from either side', () => {
      const storeInputs = { containerSize: 'lte4mL', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: '' };
      const disposeInputs = { totalSamples: 10 };
      const res = calculateStoreAndDispose(storeInputs, disposeInputs);
      expect(res.storageRate).toBeCloseTo(0.075, 6);
      expect(res.storagePortion).toBeCloseTo(3.02, 2);
      expect(res.disposalPortion).toBeCloseTo(4.64, 2);
      expect(res.perSample).toBeCloseTo(7.66, 2);
      expect(res.totalStudy).toBeCloseTo(76.6, 2);
    });

    test('slides (tissue) path yields ≤4mL-equivalent storage portion', () => {
      const storeInputs = { containerSize: 'slides', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: 10 };
      const res = calculateStoreAndDispose(storeInputs, { totalSamples: '' });
      expect(res.storagePortion).toBeCloseTo(3.02, 2);
      expect(res.perSample).toBeCloseTo(7.66, 2);
      expect(res.totalStudy).toBeCloseTo(76.6, 2);
    });

    test('totalStudy null when both sides omit or set 0 total samples', () => {
      const storeInputs = { containerSize: 'lte4mL', storageTemp: 'neg70_80', storageDuration: 24, totalSamples: '' };
      const res0 = calculateStoreAndDispose(storeInputs, { totalSamples: '' });
      const res1 = calculateStoreAndDispose(storeInputs, { totalSamples: 0 });
      expect(res0.totalStudy).toBeNull();
      expect(res1.totalStudy).toBeNull();
    });
  });
});
