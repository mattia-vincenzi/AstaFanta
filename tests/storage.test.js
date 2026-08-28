import test from 'node:test';
import assert from 'node:assert/strict';
import { exportState, importState, loadState, saveState } from '../src/storage.js';

test('state survives JSON export and import', () => {
  const state = { teams: [], players: [], assignments: [{ playerId: '1', teamId: 'team-1', price: 12, budgetRole: 'M' }], strategy: {} };
  assert.deepEqual(importState(exportState(state)), state);
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
  assert.deepEqual(loadState(storage, {}), state);
});
