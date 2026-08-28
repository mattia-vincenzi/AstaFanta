# UX Dashboard Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere l'asta più leggibile con una dashboard live della propria squadra e delle altre nove.

**Architecture:** Le statistiche restano funzioni pure in `src/domain.js`; `src/app.js` le renderizza nella schermata Asta e Squadre. Il CSS introduce componenti coerenti per KPI, carte ruolo, barre e classifica senza librerie esterne.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-ux-dashboard-design.md`

## Global Constraints

- Dashboard aggiornata da ogni modifica di assegnazioni e configurazione.
- Budget per ruolo calcolato solo per la propria squadra e per `budgetRole`.
- La classifica esclude la propria squadra e ordina per crediti residui decrescenti.
- Nessun avviso blocca una cessione.

---

### Task 1: Statistiche di dashboard testabili

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

### Task 2: Command center e vista Squadre

**Files:**
- Modify: `src/app.js`, `src/styles.css`
- Modify: `tests/render.test.js`

**Interfaces:**
- Consumes: `ownRoleSummaries(state)`, `opponentSummaries(state)`.
- Produces: `dashboard(state)` and `teams()` UI sections.

- [ ] **Step 1: Write a failing render helper test that marks a role state normal at or below target, amber above target and red above maximum.**
- [ ] **Step 2: Run `npm test -- tests/render.test.js`; verify the helper import fails.**
- [ ] **Step 3: Render dashboard above Asta live: own budget KPI, role cards and opponent table. Render the team list as uniform cards with residual budget, consumption bar, counters and expandable roster.**
- [ ] **Step 4: Add responsive CSS for dashboard grids, progress bars, role status colors, table hierarchy and card density.**
- [ ] **Step 5: Run `npm test` and `node --check src/app.js`; verify both pass.**
- [ ] **Step 6: Commit with `git add src/app.js src/styles.css src/render.js tests/render.test.js && git commit -m "feat: add auction command center"`.**

### Task 3: Manual QA and documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document dashboard metrics and their update behavior.**
- [ ] **Step 2: Run `npm test`; verify no failing test.**
- [ ] **Step 3: Serve locally, record a sale and verify own-role spend, total budget and opponent remaining credits update without reload.**
- [ ] **Step 4: Commit with `git add README.md && git commit -m "docs: describe live dashboard"`.**
