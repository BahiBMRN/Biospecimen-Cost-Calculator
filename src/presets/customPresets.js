const STORAGE_KEY = 'bslcc.customPresets.v1';

function safeGetStorage() {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

export function loadCustomPresets() {
  const storage = safeGetStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list) {
  const storage = safeGetStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore write failures (e.g. private-mode storage quota).
  }
}

export function saveCustomPreset(name, inputs) {
  const list = loadCustomPresets();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const next = [...list, { id, name, createdAt: Date.now(), inputs }];
  persist(next);
  return next;
}

export function deleteCustomPreset(id) {
  const list = loadCustomPresets();
  const next = list.filter((preset) => preset.id !== id);
  persist(next);
  return next;
}
