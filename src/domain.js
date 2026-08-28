const MANTRA_ROLES = ['Por', 'Dd', 'Ds', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];

const DEFAULT_TEAMS = Array.from({ length: 10 }, (_, index) => ({
  id: `team-${index + 1}`,
  name: `Squadra ${index + 1}`,
  budget: 1000,
  rosterSize: 28,
}));

const DEFAULT_ROLE_BUDGETS = Object.fromEntries(MANTRA_ROLES.map((role) => [role, { slots: 0, min: 0, target: 0, max: 1000 }]));
const CLASSIC_SLOTS = { P: 3, D: 8, C: 8, A: 6 };
const SETUP_RULES = {
  mantra: { id: 'mantra', label: 'Mantra', roles: MANTRA_ROLES, slots: null, defaultTeams: 10, defaultBudget: 1000, rosterSize: 28 },
  classic: { id: 'classic', label: 'Classic', roles: ['P', 'D', 'C', 'A'], slots: CLASSIC_SLOTS, defaultTeams: 8, defaultBudget: 500, rosterSize: 25 },
};

export const setupRules = (setup = 'mantra') => structuredClone(SETUP_RULES[setup] || SETUP_RULES.mantra);

export const allowedBudgetRoles = (player) => Array.isArray(player?.roles) ? [...player.roles] : [];

export const createInitialState = (players) => ({
  players,
  teams: DEFAULT_TEAMS.map((team) => ({ ...team })),
  assignments: [],
  ownTeamId: 'team-1',
  strategy: { roleBudgets: structuredClone(DEFAULT_ROLE_BUDGETS), playerNotes: {} },
});

export const createSetup = (setup, players, options = {}) => {
  const rules = setupRules(setup);
  const classic = rules.id === 'classic';
  const teamCount = Number(options.teamCount) || rules.defaultTeams;
  const budget = Number(options.budget) || rules.defaultBudget;
  const initial = createInitialState(players);
  const roleBudgets = classic
    ? Object.fromEntries(Object.entries(CLASSIC_SLOTS).map(([role, slots]) => [role, { slots, min: 0, target: 0, max: budget }]))
    : Object.fromEntries(MANTRA_ROLES.map((role) => [role, { slots: 0, min: 0, target: 0, max: budget }]));
  return {
    ...initial,
    setup: rules.id,
    teams: Array.from({ length: teamCount }, (_, index) => ({ id: `team-${index + 1}`, name: index === 0 && options.ownTeamName ? options.ownTeamName : `Squadra ${index + 1}`, budget, rosterSize: rules.rosterSize })),
    classicSlots: classic ? { ...CLASSIC_SLOTS } : null,
    strategy: { ...initial.strategy, roleBudgets },
  };
};

export const addStrategyRole = (state, role) => {
  if (state.setup === 'classic') throw new Error('I ruoli Classic sono fissi');
  if (!setupRules('mantra').roles.includes(role)) throw new Error('Ruolo Mantra non valido');
  if (state.strategy.roleBudgets[role]) return state;
  const budget = state.teams.find((team) => team.id === state.ownTeamId)?.budget ?? setupRules('mantra').defaultBudget;
  return { ...state, strategy: { ...state.strategy, roleBudgets: { ...state.strategy.roleBudgets, [role]: { slots: 0, min: 0, target: 0, max: budget } } } };
};

export const removeStrategyRole = (state, role) => {
  if (state.setup === 'classic') throw new Error('I ruoli Classic sono fissi');
  const roleBudgets = { ...state.strategy.roleBudgets };
  delete roleBudgets[role];
  return { ...state, strategy: { ...state.strategy, roleBudgets } };
};

export const canAssignClassic = (state, assignment) => {
  const limit = state.classicSlots?.[assignment.budgetRole];
  if (!limit) return false;
  return state.assignments.filter((item) => item.teamId === assignment.teamId && item.budgetRole === assignment.budgetRole).length < limit;
};

export const teamSummary = (state, teamId) => {
  const team = state.teams.find((entry) => entry.id === teamId);
  if (!team) throw new Error('Squadra non trovata');
  const assignments = state.assignments.filter((entry) => entry.teamId === teamId);
  const spent = assignments.reduce((total, entry) => total + entry.price, 0);
  return { spent, remaining: team.budget - spent, players: assignments.length, slotsRemaining: team.rosterSize - assignments.length };
};

export const renameTeam = (state, teamId, name) => {
  const team = state.teams.find((entry) => entry.id === teamId);
  if (!team) throw new Error('Squadra non trovata');
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Il nome della squadra è obbligatorio');
  return {
    ...state,
    teams: state.teams.map((entry) => entry.id === teamId ? { ...entry, name: trimmedName } : entry),
  };
};

export const resizeLeague = (state, count) => {
  if (!Number.isInteger(count) || count < 2) throw new Error('Il numero di squadre deve essere almeno 2');
  if (count < state.teams.length) {
    const removed = state.teams.slice(count);
    if (removed.some((team) => state.assignments.some((assignment) => assignment.teamId === team.id))) throw new Error('Non puoi rimuovere squadre con acquisti');
  }
  const rules = setupRules(state.setup);
  const leagueBudget = state.teams[0]?.budget ?? rules.defaultBudget;
  const defaultTeam = (index) => ({ id: `team-${index}`, name: `Squadra ${index}`, budget: leagueBudget, rosterSize: rules.rosterSize });
  const teams = count <= state.teams.length
    ? state.teams.slice(0, count)
    : [...state.teams, ...Array.from({ length: count - state.teams.length }, (_, index) => defaultTeam(state.teams.length + index + 1))];
  return { ...state, teams };
};

export const validatePlayer = (setup, player) => {
  const rules = setupRules(setup);
  const roles = Array.isArray(player.roles) ? player.roles.map((role) => String(role).trim()).filter(Boolean) : [];
  if (!player.id || !player.name || !player.team || !roles.length) throw new Error('Compila tutti i campi obbligatori');
  if (roles.some((role) => !rules.roles.includes(role))) throw new Error(`Ruolo non valido per il setup ${rules.label}`);
  return { ...player, roles };
};

export const assignPlayer = (state, assignment) => {
  const player = state.players.find((entry) => entry.id === assignment.playerId);
  if (!player) throw new Error('Giocatore non trovato');
  if (!state.teams.some((entry) => entry.id === assignment.teamId)) throw new Error('Squadra non trovata');
  if (!Number.isFinite(assignment.price) || assignment.price <= 0) throw new Error('Prezzo non valido');
  if (state.assignments.some((entry) => entry.playerId === assignment.playerId)) throw new Error('Giocatore già assegnato');
  if (!allowedBudgetRoles(player).includes(assignment.budgetRole)) throw new Error('Ruolo budget non compatibile');
  if (state.setup === 'classic' && !canAssignClassic(state, assignment)) throw new Error('Slot Classic esauriti per questo ruolo');
  return { ...state, assignments: [...state.assignments, { ...assignment, createdAt: new Date().toISOString() }] };
};

export const strategyWarnings = (state) => Object.entries(state.strategy?.roleBudgets || {})
  .flatMap(([role, budget]) => {
    const spent = state.assignments
      .filter((entry) => entry.teamId === state.ownTeamId && entry.budgetRole === role)
      .reduce((total, entry) => total + entry.price, 0);
    return spent > Number(budget.max)
      ? [{ kind: 'maximum-exceeded', role, spent, limit: Number(budget.max) }]
      : [];
  });

const mantraRoleSummaries = (state) => Object.entries(state.strategy?.roleBudgets || {})
  .map(([role, budget]) => {
    const spent = state.assignments.filter((item) => item.teamId === state.ownTeamId && item.budgetRole === role)
      .reduce((total, item) => total + item.price, 0);
    const target = Number(budget.target) || 0;
    return { role, spent, target, remaining: target - spent, maximum: Number(budget.max) || 0 };
  });

export const roleSummaries = (state, teamId) => {
  const rules = setupRules(state.setup);
  return rules.roles.map((role) => {
    const assignments = state.assignments.filter((item) => item.teamId === teamId && item.budgetRole === role);
    const slots = state.setup === 'classic' ? Number(state.classicSlots?.[role] ?? rules.slots?.[role] ?? 0) : Number(state.strategy?.roleBudgets?.[role]?.slots ?? 0);
    return {
      role,
      spent: assignments.reduce((total, item) => total + item.price, 0),
      players: assignments.length,
      slots,
      slotsRemaining: Math.max(0, slots - assignments.length),
      complete: slots > 0 && assignments.length >= slots,
    };
  });
};

export const ownRoleSummaries = (state) => state.setup === 'classic' ? roleSummaries(state, state.ownTeamId) : mantraRoleSummaries(state);

export const opponentSummaries = (state) => state.teams
  .filter((team) => team.id !== state.ownTeamId)
  .map((team) => ({ ...team, ...teamSummary(state, team.id) }))
  .sort((left, right) => right.remaining - left.remaining);
