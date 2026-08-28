import { setupRules } from './domain.js';

const STORAGE_KEY = 'tool-asta-mantra-state-v1';

export const exportState = (state) => JSON.stringify({ version: 1, state });

export const normalizeState = (state) => {
  const setup = state?.setup === 'classic' ? 'classic' : 'mantra';
  const rules = setupRules(setup);
  const players = Array.isArray(state?.players) ? state.players : [];
  const assignments = Array.isArray(state?.assignments) ? state.assignments : [];
  const roleBudgets = state?.strategy?.roleBudgets || {};
  const normalizedAssignments = setup === 'mantra' ? assignments.map((assignment) => {
    if (!['P', 'D'].includes(assignment.budgetRole)) return assignment;
    const player = players.find((entry) => entry.id === assignment.playerId);
    const candidates = assignment.budgetRole === 'P' ? ['Por'] : ['Dd', 'Ds', 'Dc', 'B'];
    return { ...assignment, budgetRole: candidates.find((role) => player?.roles?.includes(role)) || player?.roles?.[0] || assignment.budgetRole };
  }) : assignments;
  let normalizedBudgets;
  if (setup === 'classic') {
    normalizedBudgets = Object.fromEntries(Object.entries(rules.slots).map(([role, slots]) => {
      const current = roleBudgets[role] || {};
      return [role, { slots, min: Number(current.min) || 0, target: Number(current.target) || 0, max: Number(current.max) || state?.teams?.[0]?.budget || rules.defaultBudget }];
    }));
  } else {
    const defensive = roleBudgets.D;
    const migrated = { ...roleBudgets };
    if (roleBudgets.P && !migrated.Por) migrated.Por = { ...roleBudgets.P };
    if (defensive) ['Dd', 'Ds', 'Dc', 'B'].forEach((role) => { if (!migrated[role]) migrated[role] = { ...defensive }; });
    delete migrated.P; delete migrated.D;
    normalizedBudgets = Object.fromEntries(rules.roles.filter((role) => migrated[role]).map((role) => [role, migrated[role]]));
  }
  return {
    ...state,
    setup,
    teams: Array.isArray(state?.teams)
      ? state.teams.map((team) => ({ ...team, rosterSize: setup === 'classic' ? rules.rosterSize : team.rosterSize }))
      : [],
    players,
    assignments: normalizedAssignments,
    classicSlots: setup === 'classic' ? { ...rules.slots } : null,
    strategy: { ...(state?.strategy || {}), roleBudgets: normalizedBudgets },
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
