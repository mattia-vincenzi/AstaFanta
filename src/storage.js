import { setupRules } from './domain.js';

const STORAGE_KEY = 'tool-asta-mantra-state-v1';

export const exportState = (state) => JSON.stringify({ version: 1, state });

export const normalizeState = (state) => {
  const setup = state?.setup === 'classic' ? 'classic' : 'mantra';
  const rules = setupRules(setup);
  return {
    ...state,
    setup,
    teams: Array.isArray(state?.teams)
      ? state.teams.map((team) => ({ ...team, rosterSize: setup === 'classic' ? rules.rosterSize : team.rosterSize }))
      : [],
    players: Array.isArray(state?.players) ? state.players : [],
    assignments: Array.isArray(state?.assignments) ? state.assignments : [],
    classicSlots: setup === 'classic' ? { ...rules.slots } : null,
  };
};

export const importState = (text) => {
  const parsed = JSON.parse(text);
  if (parsed?.version !== 1 || !parsed.state || typeof parsed.state !== 'object') throw new Error('Backup non valido');
  return normalizeState(parsed.state);
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
