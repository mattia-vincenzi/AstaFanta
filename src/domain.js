const ROLE_GROUPS = {
  P: ['P', 'Por'],
  D: ['D', 'Dd', 'Dc', 'Ds', 'B'],
  E: ['E'], M: ['M'], C: ['C'], W: ['W'], T: ['T'], A: ['A'], Pc: ['Pc'],
};

const DEFAULT_TEAMS = Array.from({ length: 10 }, (_, index) => ({
  id: `team-${index + 1}`,
  name: `Squadra ${index + 1}`,
  budget: 1000,
  rosterSize: 28,
}));

export const allowedBudgetRoles = (player) => Object.entries(ROLE_GROUPS)
  .filter(([, tokens]) => player.roles.some((role) => tokens.includes(role)))
  .map(([role]) => role);

export const createInitialState = (players) => ({
  players,
  teams: DEFAULT_TEAMS.map((team) => ({ ...team })),
  assignments: [],
  ownTeamId: 'team-1',
  strategy: {},
});

export const teamSummary = (state, teamId) => {
  const team = state.teams.find((entry) => entry.id === teamId);
  if (!team) throw new Error('Squadra non trovata');
  const assignments = state.assignments.filter((entry) => entry.teamId === teamId);
  const spent = assignments.reduce((total, entry) => total + entry.price, 0);
  return { spent, remaining: team.budget - spent, players: assignments.length, slotsRemaining: team.rosterSize - assignments.length };
};

export const assignPlayer = (state, assignment) => {
  const player = state.players.find((entry) => entry.id === assignment.playerId);
  if (!player) throw new Error('Giocatore non trovato');
  if (!state.teams.some((entry) => entry.id === assignment.teamId)) throw new Error('Squadra non trovata');
  if (!Number.isFinite(assignment.price) || assignment.price <= 0) throw new Error('Prezzo non valido');
  if (state.assignments.some((entry) => entry.playerId === assignment.playerId)) throw new Error('Giocatore già assegnato');
  if (!allowedBudgetRoles(player).includes(assignment.budgetRole)) throw new Error('Ruolo budget non compatibile');
  return { ...state, assignments: [...state.assignments, { ...assignment, createdAt: new Date().toISOString() }] };
};
