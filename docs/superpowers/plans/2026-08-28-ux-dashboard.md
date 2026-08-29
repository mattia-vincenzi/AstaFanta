# UX Dashboard Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the auction easier to read with a live dashboard for the user's team and the other nine teams.

**Architecture:** Statistics remain pure functions in `src/domain.js`; `src/app.js` renders them on the Auction and Teams screens. CSS introduces consistent components for KPIs, role cards, bars, and standings without external libraries.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-ux-dashboard-design.md`

## Global Constraints

- The dashboard updates after every assignment and configuration change.
- Role budgets are calculated only for the user's team and by `budgetRole`.
- The standings exclude the user's team and sort by remaining credits in descending order.
- No warning blocks a sale.

---

### Task 1: Testable Dashboard Statistics

**Files:**
- Modify: `src/domain.js`
- Modify: `tests/domain.test.js`

**Interfaces:**
- Produces: `ownRoleSummaries(state)` and `opponentSummaries(state)`.

- [ ] **Step 1: Write failing tests**

```js
test('own role summaries calculate spending and remaining target', () => {
  const state = { ownTeamId: 'team-1', assignments: [{ teamId: 'team-1', price: 40, budgetRole: 'M' }], strategy: { roleBudgets: { M: { target: 60, max: 80 } } } };
  assert.deepEqual(ownRoleSummaries(state), [{ role: 'M', spent: 40, target: 60, remaining: 20, maximum: 80 }]);
});

test('opponent summaries exclude the own team and order by remaining credits', () => {
  const state = { ownTeamId: 'team-1', teams: [{ id: 'team-1', budget: 1000, rosterSize: 28 }, { id: 'team-2', budget: 1000, rosterSize: 28 }, { id: 'team-3', budget: 1000, rosterSize: 28 }], assignments: [{ teamId: 'team-2', price: 400 }, { teamId: 'team-3', price: 100 }] };
  assert.deepEqual(opponentSummaries(state).map((team) => team.id), ['team-3', 'team-2']);
});
```

- [ ] **Step 2: Run `npm test -- tests/domain.test.js`; verify the imports fail.**
- [ ] **Step 3: Implement summaries using `teamSummary`; role records include spent, target, remaining and maximum.**
- [ ] **Step 4: Run `npm test`; verify all tests pass.**
- [ ] **Step 5: Commit domain changes with `git add src/domain.js tests/domain.test.js && git commit -m "feat: add live dashboard summaries"`.**

### Task 2: Command Center and Teams View

**Files:**
- Modify: `src/app.js`, `src/styles.css`
- Modify: `tests/render.test.js`

**Interfaces:**
- Consumes: `ownRoleSummaries(state)`, `opponentSummaries(state)`.
- Produces: `dashboard(state)` and `teams()` UI sections.

- [ ] **Step 1: Write a failing render helper test that marks a role state normal at or below target, amber above target and red above maximum.**
- [ ] **Step 2: Run `npm test -- tests/render.test.js`; verify the helper import fails.**
- [ ] **Step 3: Render the dashboard above Live Auction: own-budget KPI, role cards, and opponent table. Render the team list as uniform cards with remaining budget, a usage bar, counters, and an expandable roster.**
- [ ] **Step 4: Add responsive CSS for dashboard grids, progress bars, role status colors, table hierarchy and card density.**
- [ ] **Step 5: Run `npm test` and `node --check src/app.js`; verify both pass.**
- [ ] **Step 6: Commit with `git add src/app.js src/styles.css src/render.js tests/render.test.js && git commit -m "feat: add auction command center"`.**

### Task 3: Manual QA and Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document dashboard metrics and their update behavior.**
- [ ] **Step 2: Run `npm test`; verify no failing test.**
- [ ] **Step 3: Serve locally, record a sale, and verify that own-role spending, total budget, and opponents' remaining credits update without reloading.**
- [ ] **Step 4: Commit with `git add README.md && git commit -m "docs: describe live dashboard"`.**
