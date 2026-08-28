import test from 'node:test';
import assert from 'node:assert/strict';
import { strategyWarnings } from '../src/domain.js';

test('strategy warns when own team exceeds a role maximum', () => {
  const state = {
    ownTeamId: 'team-1',
    assignments: [{ playerId: '1', teamId: 'team-1', price: 51, budgetRole: 'M' }],
    strategy: { roleBudgets: { M: { slots: 3, min: 10, target: 30, max: 50 } } },
  };
  assert.deepEqual(strategyWarnings(state), [{ kind: 'maximum-exceeded', role: 'M', spent: 51, limit: 50 }]);
});
