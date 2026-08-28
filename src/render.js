import { allowedBudgetRoles, canAssignClassic } from './domain.js';

export const filterPlayers = (players, assignedIds, filters, setup = 'mantra') => players.filter((player) => {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery = !query || `${player.name} ${player.team}`.toLowerCase().includes(query);
  const matchesRole = !filters.role || (setup === 'classic'
    ? player.roles.includes(filters.role)
    : allowedBudgetRoles(player).includes(filters.role));
  const matchesAvailability = filters.availability !== 'free' || !assignedIds.has(player.id);
  return matchesQuery && matchesRole && matchesAvailability;
});

export const catalogueForSetup = (setup, savedPlayers, defaultPlayers) => {
  if (setup !== 'classic' || !Array.isArray(savedPlayers)) return savedPlayers;
  const classicRoles = new Set(['P', 'D', 'C', 'A']);
  const compatible = savedPlayers.every((player) => Array.isArray(player.roles) && player.roles.every((role) => classicRoles.has(role)));
  return compatible ? savedPlayers : defaultPlayers;
};

export const catalogueColumns = (setup) => setup === 'classic'
  ? { role: 'R', fvm: 'FVM' }
  : { role: 'RM', fvm: 'FVM M' };

export const selectedPlayerLabel = (player) => `${player.name} · ${player.team} (${player.roles.join('/')})`;

export const suggestedBudgetRole = (roles) => roles[0] || '';

export const assignableRoles = (state, player, teamId) => allowedBudgetRoles(player || { roles: [] })
  .filter((role) => state.setup !== 'classic' || canAssignClassic(state, { teamId, budgetRole: role }));

export const roleCardModel = (setup, summary) => {
  if (setup === 'classic') {
    return {
      role: summary.role,
      value: `${summary.spent} crediti`,
      detail: `${summary.players}/${summary.slots} acquistati`,
      supporting: summary.complete ? 'Reparto completo' : `${summary.slotsRemaining} ${summary.slotsRemaining === 1 ? 'slot libero' : 'slot liberi'}`,
      progress: summary.slots ? Math.min(100, Math.round((summary.players / summary.slots) * 100)) : 0,
      complete: summary.complete,
    };
  }
  return {
    role: summary.role,
    value: `${summary.spent} / ${summary.target || '—'}`,
    detail: `${Math.max(0, summary.remaining)} crediti al target`,
    supporting: '',
    progress: summary.target ? Math.min(100, Math.round((summary.spent / summary.target) * 100)) : 0,
    complete: false,
  };
};

export const groupRosterByRole = (assignments, players, roles) => roles.map((role) => ({
  role,
  players: assignments
    .filter((assignment) => assignment.budgetRole === role)
    .map((assignment) => ({ ...assignment, ...players.find((player) => player.id === assignment.playerId) }))
    .sort((left, right) => String(left.name).localeCompare(String(right.name), 'it')),
}));

export const sortRows = (rows, key, direction = 'asc') => [...rows].sort((left, right) => {
  const a = left[key];
  const b = right[key];
  const comparison = typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a ?? '').localeCompare(String(b ?? ''), 'it', { numeric: true });
  return direction === 'desc' ? -comparison : comparison;
});
