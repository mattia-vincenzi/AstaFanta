import test from 'node:test';
import assert from 'node:assert/strict';
import { assignableRoles, filterPlayers, groupRosterByRole, roleCardModel, selectedPlayerLabel, suggestedBudgetRole, sortRows } from '../src/render.js';

test('catalogue filter keeps only free players matching a Mantra role', () => {
  const players = [
    { id: '1', name: 'Rossi', roles: ['M', 'C'], team: 'Roma' },
    { id: '2', name: 'Verdi', roles: ['P'], team: 'Inter' },
  ];
  assert.deepEqual(
    filterPlayers(players, new Set(['2']), { role: 'M', availability: 'free', query: '' }),
    [players[0]],
  );
});

test('selected catalogue player has a clear assignment label', () => {
  const player = { id: '42', name: 'Bianchi', team: 'Milan', roles: ['T', 'A'] };
  assert.equal(selectedPlayerLabel(player), 'Bianchi · Milan (T/A)');
});

test('table rows sort numbers descending and text ascending', () => {
  const rows = [{ name: 'Zeta', remaining: 40 }, { name: 'Alfa', remaining: 100 }];
  assert.deepEqual(sortRows(rows, 'remaining', 'desc').map((row) => row.remaining), [100, 40]);
  assert.deepEqual(sortRows(rows, 'name', 'asc').map((row) => row.name), ['Alfa', 'Zeta']);
});

test('auction suggests the first compatible budget role', () => {
  assert.equal(suggestedBudgetRole(['M', 'C']), 'M');
  assert.equal(suggestedBudgetRole([]), '');
});

test('Classic dashboard cards describe fixed slot occupancy', () => {
  assert.deepEqual(roleCardModel('classic', { role: 'P', spent: 20, players: 2, slots: 3, slotsRemaining: 1, complete: false }), {
    role: 'P', value: '20 crediti', detail: '2/3 acquistati', supporting: '1 slot libero', progress: 67, complete: false,
  });
});

test('Mantra dashboard cards retain strategic credit targets', () => {
  assert.deepEqual(roleCardModel('mantra', { role: 'M', spent: 40, target: 60, remaining: 20, maximum: 80 }), {
    role: 'M', value: '40 / 60', detail: '20 crediti al target', supporting: '', progress: 67, complete: false,
  });
});

test('Classic assignment excludes a role whose team quota is full', () => {
  const player = { id: '1', roles: ['D'] };
  const state = { setup: 'classic', classicSlots: { P: 3, D: 8, C: 8, A: 6 }, assignments: Array.from({ length: 8 }, (_, index) => ({ playerId: String(index), teamId: 'team-1', budgetRole: 'D' })) };
  assert.deepEqual(assignableRoles(state, player, 'team-1'), []);
  assert.deepEqual(assignableRoles({ ...state, assignments: state.assignments.slice(0, 7) }, player, 'team-1'), ['D']);
});

test('expanded roster is grouped in Classic role order and sorted by name', () => {
  const players = [{ id: '1', name: 'Zeta' }, { id: '2', name: 'Alfa' }, { id: '3', name: 'Portiere' }];
  const assignments = [{ playerId: '1', budgetRole: 'D', price: 3 }, { playerId: '2', budgetRole: 'D', price: 2 }, { playerId: '3', budgetRole: 'P', price: 1 }];
  assert.deepEqual(groupRosterByRole(assignments, players, ['P', 'D', 'C', 'A']).map((group) => [group.role, group.players.map((item) => item.name)]), [
    ['P', ['Portiere']], ['D', ['Alfa', 'Zeta']], ['C', []], ['A', []],
  ]);
});
