import test from 'node:test';
import assert from 'node:assert/strict';
import { exportState, importState, loadState, saveState } from '../src/storage.js';

test('state survives JSON export and import', () => {
  const state = { teams: [], players: [], assignments: [{ playerId: '1', teamId: 'team-1', price: 12, budgetRole: 'M' }], strategy: {} };
  assert.deepEqual(importState(exportState(state)), { ...state, setup: 'mantra', classicSlots: null, strategy: { roleBudgets: {} } });
});

test('invalid stored JSON returns the fallback state', () => {
  const storage = { getItem: () => '{', setItem() {} };
  assert.deepEqual(loadState(storage, { assignments: [] }), { assignments: [] });
});

test('save writes a reloadable state', () => {
  let saved;
  const storage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
  const state = { teams: [], players: [], assignments: [], strategy: { ownTeam: 'Io' } };
  saveState(storage, state);
  assert.deepEqual(loadState(storage, {}), { ...state, setup: 'mantra', classicSlots: null, strategy: { ...state.strategy, roleBudgets: {} } });
});

test('legacy backups without a setup are migrated to Mantra', () => {
  const legacy = { teams: [{ id: 'team-1', budget: 1000, rosterSize: 28 }], players: [], assignments: [], strategy: {} };
  assert.equal(importState(JSON.stringify({ version: 1, state: legacy })).setup, 'mantra');
});

test('Classic backups retain league configuration and restore fixed slots', () => {
  const classic = { setup: 'classic', teams: [{ id: 'team-1', name: 'Io', budget: 650, rosterSize: 99 }], players: [{ id: 'custom', roles: ['A'] }], assignments: [], strategy: {} };
  const restored = importState(JSON.stringify({ version: 1, state: classic }));
  assert.equal(restored.setup, 'classic');
  assert.equal(restored.teams[0].budget, 650);
  assert.equal(restored.teams[0].rosterSize, 25);
  assert.deepEqual(restored.classicSlots, { P: 3, D: 8, C: 8, A: 6 });
  assert.equal(restored.players[0].id, 'custom');
});

test('legacy Mantra aggregate roles migrate to real catalogue roles', () => {
  const legacy = {
    setup: 'mantra', teams: [{ id: 'team-1', budget: 1000, rosterSize: 28 }],
    players: [{ id: '1', name: 'Portiere', team: 'Roma', roles: ['Por'] }, { id: '2', name: 'Terzino', team: 'Milan', roles: ['Dd', 'E'] }],
    assignments: [{ playerId: '1', teamId: 'team-1', price: 2, budgetRole: 'P' }, { playerId: '2', teamId: 'team-1', price: 3, budgetRole: 'D' }],
    strategy: { roleBudgets: { P: { slots: 3, min: 1, target: 20, max: 30 }, D: { slots: 8, min: 1, target: 80, max: 100 } } },
  };
  const restored = importState(JSON.stringify({ version: 1, state: legacy }));
  assert.deepEqual(restored.assignments.map(({ budgetRole }) => budgetRole), ['Por', 'Dd']);
  assert.deepEqual(restored.strategy.roleBudgets.Por, legacy.strategy.roleBudgets.P);
  assert.deepEqual(restored.strategy.roleBudgets.Dd, legacy.strategy.roleBudgets.D);
  assert.equal(restored.strategy.roleBudgets.P, undefined);
  assert.equal(restored.strategy.roleBudgets.D, undefined);
});
