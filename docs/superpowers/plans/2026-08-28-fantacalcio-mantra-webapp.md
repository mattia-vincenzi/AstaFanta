# Fantacalcio Mantra Auction Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web app that manages the auction, budgets, and strategy for ten Mantra teams.

**Architecture:** Single-page application with no backend. Auction logic lives in pure, testable JavaScript modules; the interface renders state and saves it in the browser. Player valuations are converted once into static JSON.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, Node.js built-in test runner, `localStorage`, and JSON.

**Spec:** `docs/superpowers/specs/2026-08-28-fantacalcio-mantra-webapp-design.md`

## Global Constraints

- No login, backend, or runtime dependency.
- Ten teams with configurable initial values of 1000 credits and 28 slots.
- A player can have only one assignment; the selected budget role must be compatible.
- The catalogue is editable in-app; deletion is allowed only for unassigned players.
- State and Strategy are persisted in `localStorage` and can be exported/imported as JSON.
- Only missing data, a non-positive price, an incompatible role, and duplicate assignment block a sale.

---

### Task 1: Auction model and scaffold

**Files:**
- Create: `package.json`, `index.html`, `src/domain.js`, `tests/domain.test.js`

**Interfaces:**
- Produces: `createInitialState(players)`, `assignPlayer(state, assignment)`, `teamSummary(state, teamId)`, `allowedBudgetRoles(player)`.

- [ ] **Step 1: Write failing domain tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { assignPlayer, createInitialState, teamSummary } from '../src/domain.js';

const players = [{ id: '1', name: 'Rossi', roles: ['M', 'C'] }];
test('assignment spends budget and reduces one slot', () => {
  const state = assignPlayer(createInitialState(players), { playerId: '1', teamId: 'team-1', price: 12, budgetRole: 'M' });
  assert.deepEqual(teamSummary(state, 'team-1'), { spent: 12, remaining: 988, players: 1, slotsRemaining: 27 });
});
test('assigned player cannot be sold twice', () => {
  const once = assignPlayer(createInitialState(players), { playerId: '1', teamId: 'team-1', price: 12, budgetRole: 'M' });
  assert.throws(() => assignPlayer(once, { playerId: '1', teamId: 'team-2', price: 13, budgetRole: 'C' }), /già assegnato/);
});
```

- [ ] **Step 2: Run `npm test -- tests/domain.test.js`; verify it fails because `src/domain.js` is absent.**
- [ ] **Step 3: Implement the smallest immutable model satisfying the two tests; add `"test": "node --test"` and module mode to `package.json`.**
- [ ] **Step 4: Run `npm test -- tests/domain.test.js`; verify two passing tests.**
- [ ] **Step 5: Commit with `git add package.json index.html src/domain.js tests/domain.test.js && git commit -m "feat: add auction domain model"`.**

### Task 2: Dataset and persistence

**Files:**
- Create: `src/storage.js`, `src/players.json`, `tests/storage.test.js`
- Modify: `src/domain.js`

**Interfaces:**
- Produces: `saveState(storage, state)`, `loadState(storage, fallback)`, `exportState(state)`, `importState(text)`, `updateStrategy(state, strategy)`.

- [ ] **Step 1: Write a test that JSON export/import restores assignments exactly, plus a test where malformed storage JSON returns the supplied fallback.**
- [ ] **Step 2: Run `npm test -- tests/storage.test.js`; verify it fails because `src/storage.js` is absent.**
- [ ] **Step 3: Implement versioned JSON serialization and defensive parsing. Convert the ID, RM, Name, Team, Qt, and FVM M columns from `Quotazioni_Fantacalcio_Stagione_2026_27.xlsx` to `src/players.json`, preserving normalized multi-roles. Add default strategy rows for P/D/E/M/C/W/T/A/Pc.**
- [ ] **Step 4: Run `npm test`; verify all tests pass.**
- [ ] **Step 5: Commit with `git add src tests && git commit -m "feat: persist auction state locally"`.**

### Task 3: Live auction and catalogue

**Files:**
- Create: `src/app.js`, `src/render.js`, `src/styles.css`, `tests/render.test.js`
- Modify: `index.html`

**Interfaces:**
- Produces: `filterPlayers(players, assignedIds, filters)` and `renderAuction(state, root)`.

- [ ] **Step 1: Write a failing test asserting that an availability=free and role=M filter returns an unassigned M/C player but excludes an assigned P player.**
- [ ] **Step 2: Run `npm test -- tests/render.test.js`; verify it fails because `src/render.js` is absent.**
- [ ] **Step 3: Implement the Auction page: search, role/availability filters, player table, sale form with compatible role choices, validation, negative-budget confirmation, save/rerender, and undo last assignment.**
- [ ] **Step 4: Run `npm test`; verify all tests pass.**
- [ ] **Step 5: Commit with `git add index.html src tests && git commit -m "feat: add live auction interface"`.**

### Task 4: Teams, Strategy, editable catalogue, and backup

**Files:**
- Modify: `src/domain.js`, `src/app.js`, `src/render.js`, `src/styles.css`
- Create: `tests/strategy.test.js`

**Interfaces:**
- Produces: `roleBudgetSummary(state, teamId, role)` and `strategyWarnings(state)`.

- [ ] **Step 1: Write a failing test that a price of 51 in M produces `maximum-exceeded` when the own team M maximum is 50.**
- [ ] **Step 2: Run `npm test -- tests/strategy.test.js`; verify it fails because the strategy functions are absent.**
- [ ] **Step 3: Implement the ten-team dashboard and per-team roster, then the Strategia editor for own-team name, total budget, roster size, role rows, and player priority/cap/note. Add a catalog editor that creates, edits and deletes free players while validating unique IDs and at least one role; assigned players cannot be deleted. Display non-blocking warnings. Add export, file import, reset confirmation, assignment correction and deletion.**
- [ ] **Step 4: Run `npm test`; verify all tests pass.**
- [ ] **Step 5: Commit with `git add src tests && git commit -m "feat: add strategy and team dashboards"`.**

### Task 5: Handoff verification

**Files:**
- Create: `README.md`, `.gitignore`

- [ ] **Step 1: Document `npm test`, serving locally, backup/import and source-data provenance. Ignore `.DS_Store`.**
- [ ] **Step 2: Run `npm test`; verify no test failures.**
- [ ] **Step 3: Serve the app locally; sell a player, reload, export, reset, import and verify player and budget are restored.**
- [ ] **Step 4: Commit with `git add README.md .gitignore && git commit -m "docs: add local usage guide"`.**
