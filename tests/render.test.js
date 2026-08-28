import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPlayers } from '../src/render.js';

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
