import test from 'node:test';
import assert from 'node:assert/strict';
import { assignPlayer, canAssignClassic, createInitialState, createSetup, opponentSummaries, ownRoleSummaries, renameTeam, resizeLeague, roleSummaries, setupRules, teamSummary, validatePlayer } from '../src/domain.js';

const players = [{ id: '1', name: 'Rossi', roles: ['M', 'C'], team: 'Roma', qt: 10, fvm: 20 }];

test('assignment spends budget and reduces one slot', () => {
  const state = assignPlayer(createInitialState(players), {
    playerId: '1', teamId: 'team-1', price: 12, budgetRole: 'M',
  });

  assert.deepEqual(teamSummary(state, 'team-1'), {
    spent: 12, remaining: 988, players: 1, slotsRemaining: 27,
  });
});

test('assigned player cannot be sold twice', () => {
  const once = assignPlayer(createInitialState(players), {
    playerId: '1', teamId: 'team-1', price: 12, budgetRole: 'M',
  });

  assert.throws(() => assignPlayer(once, {
    playerId: '1', teamId: 'team-2', price: 13, budgetRole: 'C',
  }), /già assegnato/);
});

test('renaming a team preserves its configuration and the other teams', () => {
  const initial = createInitialState(players);
  const state = renameTeam(initial, 'team-2', 'I Campioni');

  assert.equal(state.teams[1].name, 'I Campioni');
  assert.equal(state.teams[1].budget, 1000);
  assert.equal(state.teams[1].rosterSize, 28);
  assert.equal(state.teams[0].name, 'Squadra 1');
});

test('role dashboard calculates own spending and remaining target', () => {
  const state = createInitialState(players);
  state.strategy.roleBudgets.M = { slots: 3, min: 0, target: 60, max: 80 };
  state.assignments = [{ playerId: '1', teamId: 'team-1', price: 40, budgetRole: 'M' }];
  assert.deepEqual(ownRoleSummaries(state).find((item) => item.role === 'M'), { role: 'M', spent: 40, target: 60, remaining: 20, maximum: 80 });
});

test('opponent dashboard excludes own team and sorts by remaining credits', () => {
  const state = createInitialState(players);
  state.assignments = [{ playerId: '1', teamId: 'team-2', price: 400, budgetRole: 'M' }, { playerId: 'x', teamId: 'team-3', price: 100, budgetRole: 'M' }];
  assert.deepEqual(opponentSummaries(state).slice(-2).map((team) => team.id), ['team-3', 'team-2']);
});

test('league resize adds default teams and refuses to remove assigned teams', () => {
  const initial = createInitialState(players);
  assert.equal(resizeLeague(initial, 12).teams.length, 12);
  const assigned = { ...initial, assignments: [{ playerId: '1', teamId: 'team-10', price: 10, budgetRole: 'M' }] };
  assert.throws(() => resizeLeague(assigned, 9), /acquisti/);
});

test('classic setup defaults to eight teams, 500 credits and 25 slots', () => {
  const state = createSetup('classic', [], {});
  assert.equal(state.setup, 'classic');
  assert.equal(state.teams.length, 8);
  assert.equal(state.teams[0].budget, 500);
  assert.equal(state.teams[0].rosterSize, 25);
});

test('classic rejects a fourth goalkeeper for the same team', () => {
  const state = createSetup('classic', [{ id: 'p4', roles: ['P'] }], {});
  state.assignments = [1, 2, 3].map((number) => ({ playerId: `p${number}`, teamId: 'team-1', price: 1, budgetRole: 'P' }));
  assert.equal(canAssignClassic(state, { playerId: 'p4', teamId: 'team-1', budgetRole: 'P' }), false);
});

test('setup rules expose the complete Classic and Mantra contracts', () => {
  assert.deepEqual(setupRules('classic'), {
    id: 'classic', label: 'Classic', roles: ['P', 'D', 'C', 'A'], slots: { P: 3, D: 8, C: 8, A: 6 }, defaultTeams: 8, defaultBudget: 500, rosterSize: 25,
  });
  assert.deepEqual(setupRules('mantra').roles, ['P', 'D', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc']);
  assert.equal(setupRules('mantra').defaultTeams, 10);
  assert.equal(setupRules('mantra').defaultBudget, 1000);
  assert.equal(setupRules('mantra').rosterSize, 28);
});

test('classic enforces every positional quota', () => {
  for (const [role, limit] of Object.entries({ P: 3, D: 8, C: 8, A: 6 })) {
    const state = createSetup('classic', [{ id: `${role}-next`, roles: [role] }], {});
    state.assignments = Array.from({ length: limit }, (_, index) => ({ playerId: `${role}-${index}`, teamId: 'team-1', price: 1, budgetRole: role }));
    assert.throws(() => assignPlayer(state, { playerId: `${role}-next`, teamId: 'team-1', price: 1, budgetRole: role }), /Slot Classic esauriti/);
  }
});

test('classic role summaries report spending and fixed slot occupancy', () => {
  const state = createSetup('classic', [], {});
  state.assignments = [
    { playerId: 'p1', teamId: 'team-1', price: 12, budgetRole: 'P' },
    { playerId: 'p2', teamId: 'team-1', price: 8, budgetRole: 'P' },
  ];
  assert.deepEqual(roleSummaries(state, 'team-1')[0], {
    role: 'P', spent: 20, players: 2, slots: 3, slotsRemaining: 1, complete: false,
  });
  assert.deepEqual(ownRoleSummaries(state).map(({ role }) => role), ['P', 'D', 'C', 'A']);
});

test('resizing a custom Classic league preserves its budget and roster rules', () => {
  const state = createSetup('classic', [], { teamCount: 8, budget: 650 });
  const resized = resizeLeague(state, 10);
  assert.deepEqual(resized.teams.slice(8).map(({ budget, rosterSize }) => [budget, rosterSize]), [[650, 25], [650, 25]]);
});

test('catalogue player validation follows the active setup roles', () => {
  assert.deepEqual(validatePlayer('classic', { id: '1', name: 'Rossi', team: 'Roma', roles: ['D'], qt: 1, fvm: 2 }).roles, ['D']);
  assert.throws(() => validatePlayer('classic', { id: '2', name: 'Verdi', team: 'Roma', roles: ['M'], qt: 1, fvm: 2 }), /Classic/);
  assert.deepEqual(validatePlayer('mantra', { id: '3', name: 'Neri', team: 'Roma', roles: ['M', 'C'], qt: 1, fvm: 2 }).roles, ['M', 'C']);
});
