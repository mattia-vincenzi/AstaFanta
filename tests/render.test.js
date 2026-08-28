import test from 'node:test';
import assert from 'node:assert/strict';
import { assignableRoles, catalogueColumns, catalogueForSetup, filterPlayers, groupRosterByRole, roleCardModel, selectedPlayerLabel, suggestedBudgetRole, sortRows } from '../src/render.js';

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

test('Mantra and Classic filters use their exact catalogue roles', () => {
  const players = [
    { id: '1', name: 'Portiere Mantra', roles: ['Por'], team: 'Roma' },
    { id: '2', name: 'Difensore Mantra', roles: ['Dc'], team: 'Inter' },
    { id: '3', name: 'Portiere Classic', roles: ['P'], team: 'Milan' },
  ];
  assert.deepEqual(filterPlayers(players, new Set(), { role: 'Por', availability: 'free', query: '' }, 'mantra').map(({ id }) => id), ['1']);
  assert.deepEqual(filterPlayers(players, new Set(), { role: 'Dc', availability: 'free', query: '' }, 'mantra').map(({ id }) => id), ['2']);
  assert.deepEqual(filterPlayers(players, new Set(), { role: 'P', availability: 'free', query: '' }, 'classic').map(({ id }) => id), ['3']);
});

test('an incompatible saved Classic catalogue is restored from Classic defaults', () => {
  const saved = [{ id: '1', name: 'Portiere', team: 'Roma', roles: ['Por'] }];
  const defaults = [{ id: '1', name: 'Portiere', team: 'Roma', roles: ['P'] }];
  assert.equal(catalogueForSetup('classic', saved, defaults), defaults);
  assert.equal(catalogueForSetup('classic', defaults, []), defaults);
});

test('catalogue column labels follow the source format', () => {
  assert.deepEqual(catalogueColumns('classic'), { role: 'R', fvm: 'FVM' });
  assert.deepEqual(catalogueColumns('mantra'), { role: 'RM', fvm: 'FVM M' });
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
  assert.deepEqual(roleCardModel('classic', { role: 'P', spent: 20, players: 2, slots: 3, slotsRemaining: 1, complete: false, maximum: 40, targetBands: [] }), {
    role: 'P', value: '20 / 40', detail: '2/3 acquistati · 20 crediti al massimo', supporting: '1 slot libero', progress: 50, complete: false, budgetStatus: 'within',
  });
});

test('role budget status turns warning at eighty percent and over above maximum', () => {
  assert.equal(roleCardModel('classic', { role: 'P', spent: 79, players: 1, slots: 3, slotsRemaining: 2, complete: false, maximum: 100 }).budgetStatus, 'within');
  assert.equal(roleCardModel('classic', { role: 'P', spent: 80, players: 1, slots: 3, slotsRemaining: 2, complete: false, maximum: 100 }).budgetStatus, 'warning');
  assert.equal(roleCardModel('mantra', { role: 'Por', spent: 100, players: 1, slots: 3, maximum: 100 }).budgetStatus, 'warning');
  assert.equal(roleCardModel('classic', { role: 'P', spent: 101, players: 1, slots: 3, slotsRemaining: 2, complete: false, maximum: 100 }).budgetStatus, 'over');
});

test('Mantra dashboard cards use the configured maximum and show player count', () => {
  assert.deepEqual(roleCardModel('mantra', { role: 'M', spent: 40, target: 60, remaining: 20, maximum: 80, players: 2, slots: 3 }), {
    role: 'M', value: '40 / 80', detail: '2 giocatori · 40 crediti al massimo', supporting: '2/3 slot', progress: 50, complete: false, budgetStatus: 'within',
  });
});

test('Mantra dashboard cards surface configured target bands', () => {
  assert.equal(roleCardModel('mantra', { role: 'M', spent: 0, target: 40, remaining: 40, players: 0, slots: 3, targetBands: [{ label: 'Titolari', min: 10, max: 35 }] }).supporting, 'Titolari 10-35');
  assert.equal(roleCardModel('mantra', { role: 'M', spent: 0, target: 0, remaining: 0, players: 0, targetBands: [{ label: '<Top>', min: 1, max: 2 }] }).supporting, '&lt;Top&gt; 1-2');
});

test('Mantra dashboard cards surface configured minimum and maximum limits', () => {
  const card = roleCardModel('mantra', { role: 'M', spent: 0, target: 0, remaining: 0, minimum: 15, maximum: 80, players: 0, slots: 0 });
  assert.equal(card.value, '0 / 80');
  assert.equal(card.budgetStatus, 'within');
});

test('Mantra dashboard cards flag spending above the configured maximum', () => {
  const card = roleCardModel('mantra', { role: 'Por', spent: 50, maximum: 40, players: 2, slots: 3 });
  assert.equal(card.value, '50 / 40');
  assert.equal(card.detail, '2 giocatori · 0 crediti al massimo');
  assert.equal(card.budgetStatus, 'over');
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
