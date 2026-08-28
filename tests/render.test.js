import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPlayers, selectedPlayerLabel, suggestedBudgetRole, sortRows } from '../src/render.js';

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
