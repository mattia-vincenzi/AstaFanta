import test from 'node:test';
import assert from 'node:assert/strict';
import { assignPlayer, createInitialState, teamSummary } from '../src/domain.js';

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
