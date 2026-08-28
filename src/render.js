import { allowedBudgetRoles, canAssignClassic } from './domain.js';

const escapeText = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export const filterPlayers = (players, assignedIds, filters, setup = 'mantra') => players.filter((player) => {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery = !query || `${player.name} ${player.team}`.toLowerCase().includes(query);
  const matchesRole = !filters.role || player.roles.includes(filters.role);
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

const roleBudgetStatus = (spent, maximum) => {
  if (!maximum) return 'unset';
  if (spent > maximum) return 'over';
  return spent / maximum >= 0.8 ? 'warning' : 'within';
};

export const roleCardModel = (setup, summary) => {
  const spent = Number(summary.spent) || 0;
  const maximum = Number(summary.maximum) || 0;
  const remaining = Math.max(0, maximum - spent);
  const budgetStatus = roleBudgetStatus(spent, maximum);
  const bandSummary = (summary.targetBands || []).map((band) => `${escapeText(band.label)} ${band.min}-${band.max}`).join(' · ');
  if (setup === 'classic') {
    return {
      role: summary.role,
      value: `${spent} / ${maximum || '—'}`,
      detail: `${summary.players}/${summary.slots} acquistati · ${remaining} crediti al massimo`,
      supporting: bandSummary || (summary.complete ? 'Reparto completo' : `${summary.slotsRemaining} ${summary.slotsRemaining === 1 ? 'slot libero' : 'slot liberi'}`),
      progress: maximum ? Math.min(100, Math.round((spent / maximum) * 100)) : 0,
      complete: summary.complete,
      budgetStatus,
    };
  }
  const playerCount = summary.players || 0;
  const playerLabel = playerCount === 1 ? 'giocatore' : 'giocatori';
  return {
    role: summary.role,
    value: `${spent} / ${maximum || '—'}`,
    detail: `${playerCount} ${playerLabel} · ${remaining} crediti al massimo`,
    supporting: bandSummary || (summary.slots ? `${playerCount}/${summary.slots} slot` : ''),
    progress: maximum ? Math.min(100, Math.round((spent / maximum) * 100)) : 0,
    complete: false,
    budgetStatus,
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
