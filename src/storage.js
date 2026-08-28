const STORAGE_KEY = 'tool-asta-mantra-state-v1';

export const exportState = (state) => JSON.stringify({ version: 1, state });

export const importState = (text) => {
  const parsed = JSON.parse(text);
  if (parsed?.version !== 1 || !parsed.state || typeof parsed.state !== 'object') throw new Error('Backup non valido');
  return parsed.state;
};

export const saveState = (storage, state) => storage.setItem(STORAGE_KEY, exportState(state));

export const loadState = (storage, fallback) => {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? importState(raw) : fallback;
  } catch {
    return fallback;
  }
};
