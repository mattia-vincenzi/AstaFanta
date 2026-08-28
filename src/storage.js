import { setupRules } from './domain.js';

const STORAGE_KEY = 'tool-asta-mantra-state-v1';

export const exportState = (state) => JSON.stringify({ version: 1, state });

export const normalizeState = (state) => {
  const setup = state?.setup === 'classic' ? 'classic' : 'mantra';
  const rules = setupRules(setup);
  const players = Array.isArray(state?.players) ? state.players : [];
  const assignments = Array.isArray(state?.assignments) ? state.assignments : [];
  const roleBudgets = state?.strategy?.roleBudgets || {};
  const rawRoleTargets = state?.strategy?.roleTargets || {};
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
  const roleTargets = Object.fromEntries(rules.roles.map((role) => [role, (Array.isArray(rawRoleTargets[role]) ? rawRoleTargets[role] : []).map((band, index) => ({
    id: String(band?.id || `${role}-${index + 1}`),
    label: String(band?.label || 'Fascia target'),
    min: Number(band?.min) || 0,
    max: Number(band?.max) || 0,
    players: String(band?.players || ''),
  }))]));
  const teams = Array.isArray(state?.teams)
    ? state.teams.map((team, index) => ({ ...team, name: String(team?.name || `Squadra ${index + 1}`), rosterSize: setup === 'classic' ? rules.rosterSize : team.rosterSize }))
    : [];
  return {
    ...state,
    setup,
    teams,
    ownTeamId: state?.ownTeamId || teams[0]?.id,
    players,
    assignments: normalizedAssignments,
    classicSlots: setup === 'classic' ? { ...rules.slots } : null,
    strategy: { ...(state?.strategy || {}), roleBudgets: normalizedBudgets, roleTargets },
  };
};

const hasUniqueIds = (entries) => new Set(entries.map((entry) => entry.id)).size === entries.length;

const validateNormalizedState = (state) => {
  const rules = setupRules(state.setup);
  const validRoles = new Set(rules.roles);
  const validTeams = Array.isArray(state.teams)
    && state.teams.length > 0
    && hasUniqueIds(state.teams)
    && state.teams.every((team) => typeof team?.id === 'string' && team.id && typeof team.name === 'string' && team.name.trim() && Number.isInteger(team.budget) && team.budget >= 1 && Number.isInteger(team.rosterSize) && team.rosterSize >= 1);
  const validPlayers = Array.isArray(state.players)
    && hasUniqueIds(state.players)
    && state.players.every((player) => typeof player?.id === 'string' && player.id && typeof player.name === 'string' && player.name.trim() && typeof player.team === 'string' && player.team.trim() && Array.isArray(player.roles) && player.roles.length > 0 && player.roles.every((role) => validRoles.has(role)));
  if (!validTeams || !validPlayers || !state.teams.some((team) => team.id === state.ownTeamId) || !Array.isArray(state.assignments)) throw new Error('Backup non valido');

  const teamIds = new Set(state.teams.map((team) => team.id));
  const playersById = new Map(state.players.map((player) => [player.id, player]));
  const assignedPlayerIds = new Set();
  for (const assignment of state.assignments) {
    const player = playersById.get(assignment?.playerId);
    if (!player
      || !teamIds.has(assignment.teamId)
      || assignedPlayerIds.has(assignment.playerId)
      || !Number.isFinite(assignment.price)
      || assignment.price <= 0
      || !validRoles.has(assignment.budgetRole)
      || !player.roles.includes(assignment.budgetRole)) throw new Error('Backup non valido');
    assignedPlayerIds.add(assignment.playerId);
  }
  return state;
};

export const importState = (text) => {
  const parsed = JSON.parse(text);
  if (parsed?.version !== 1 || !parsed.state || typeof parsed.state !== 'object') throw new Error('Backup non valido');
  return validateNormalizedState(normalizeState(parsed.state));
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
