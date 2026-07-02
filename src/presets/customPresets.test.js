import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { deleteCustomPreset, loadCustomPresets, saveCustomPreset } from './customPresets.js';

const STORAGE_KEY = 'bslcc.customPresets.v1';

describe('customPresets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('loadCustomPresets returns [] when nothing is stored', () => {
    expect(loadCustomPresets()).toEqual([]);
  });

  test('saveCustomPreset persists a preset and round-trips through loadCustomPresets', () => {
    const inputs = { N_participants: 42, region: 'eu' };
    const afterSave = saveCustomPreset('My Preset', inputs);

    expect(afterSave).toHaveLength(1);
    expect(afterSave[0]).toMatchObject({ name: 'My Preset', inputs });
    expect(afterSave[0].id).toBeTruthy();

    const reloaded = loadCustomPresets();
    expect(reloaded).toEqual(afterSave);
  });

  test('saveCustomPreset appends to an existing list rather than overwriting', () => {
    saveCustomPreset('First', { a: 1 });
    const afterSecond = saveCustomPreset('Second', { a: 2 });

    expect(afterSecond).toHaveLength(2);
    expect(afterSecond.map((p) => p.name)).toEqual(['First', 'Second']);
  });

  test('deleteCustomPreset removes only the matching id', () => {
    const list = saveCustomPreset('First', { a: 1 });
    saveCustomPreset('Second', { a: 2 });

    const afterDelete = deleteCustomPreset(list[0].id);

    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].name).toBe('Second');
    expect(loadCustomPresets()).toEqual(afterDelete);
  });

  test('loadCustomPresets returns [] and does not throw when localStorage.getItem throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => loadCustomPresets()).not.toThrow();
    expect(loadCustomPresets()).toEqual([]);

    spy.mockRestore();
  });

  test('loadCustomPresets returns [] when stored value is corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadCustomPresets()).toEqual([]);
  });

  test('loadCustomPresets returns [] when stored value is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));
    expect(loadCustomPresets()).toEqual([]);
  });
});
