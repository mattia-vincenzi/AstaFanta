# Tool Asta Mantra Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the blocking defects found with Playwright and make auctions, the catalogue, budgets, teams, and backups consistent even in edge cases.

**Architecture:** Maintain the existing separation between pure rules (`src/domain.js`), normalization/persistence (`src/storage.js`), and rendering/event handling (`src/app.js`). Every fix must first have a domain or Playwright regression test and must preserve Mantra/Classic mode.

**Tech Stack:** JavaScript ES modules, Node test runner, HTML/CSS vanilla, Playwright Chromium.

**Spec:** `docs/superpowers/plans/2026-08-28-qa-test-plan.md` and `UX-CONTRACT.md`.

## Global Constraints

- The auction mode remains immutable after creation.
- Classic retains a 25-player roster and P/D/C/A quotas of 3/8/8/6.
- Mantra uses only the actual roles (`Por`, `Dd`, `Ds`, `Dc`, `B`, `E`, `M`, `C`, `W`, `T`, `A`, `Pc`).
- Invalid imports must not replace or corrupt the current state.
- Every destructive action remains confirmed and reversible where required by the UX contract.

### Task 1: Restore Catalogue Saving and Editing (P0)

**Files:**
- Modify: `src/app.js:126` — robust catalogue form detection without using `event.target.id`, which controls can shadow.
- Modify: `src/app.js:87` — add programmatic labels to the six form fields.
- Test: `tests/render.test.js` — cover validation/normalization of entered data.
- Create: `tests/e2e/catalogue.spec.js` — insertion and editing via click and keyboard.

**Interfaces:**
- Consumes: `validatePlayer(setup, player)` from `src/domain.js`.
- Produces: catalogue submission that updates or adds a row, persists it, and closes the form again.

- [x] **Step 1: Write the failing test**

  In Playwright, open Catalogue, click “Add player,” enter ID `qa-1`, name `Test`, team `QA`, and role `M`, then click “Save player.” Assert: a `qa-1` row exists after rendering and after a refresh.

- [x] **Step 2: Run test to verify it fails**

  Run: `npx playwright test tests/e2e/catalogue.spec.js -g "inserisce"`

  Expected: FAIL because the submit handler does not enter the `player-form` branch.

- [x] **Step 3: Implement minimal fix**

  Use a stable reference (`event.target.matches('#player-form')` or a class/data attribute that cannot be shadowed), add an explicit `type="submit"`, and associate every input with a `<label for>`.

- [x] **Step 4: Run focused verification**

  Run: `npx playwright test tests/e2e/catalogue.spec.js -g "inserisce"`

  Expected: PASS; the record survives the refresh.

- [x] **Step 5: Add edit/delete regressions**

  Verify name/role editing, rejection of a duplicate ID with unchanged state, confirmed deletion of an unassigned player, and absence of the Delete button for an assigned player.

### Task 2: Make Rosters and Budgets Atomic (P1)

**Files:**
- Modify: `src/domain.js:80-105` — validate total Mantra capacity and financial inputs.
- Modify: `src/app.js:119-126` — show inline errors and do not save budgets below spending.
- Test: `tests/domain.test.js` — Mantra capacity, budgets, and boundary values.
- Create: `tests/e2e/budget-roster.spec.js` — UI flows.

**Interfaces:**
- Consumes: `teamSummary`, `assignPlayer`, `setupRules`.
- Produces: assignment rejected when `players >= rosterSize`; budget must be a positive integer and cannot be lower than spending without explicit confirmation.

- [x] **Step 1: Write failing domain tests**

  Create a one-slot Mantra roster with an existing purchase and verify that `assignPlayer` throws `Rosa piena`. Create a team with spending of 30 and verify that updating its budget to 1 is rejected.

- [x] **Step 2: Run to verify failure**

  Run: `npm test -- --test-name-pattern="rosa piena|budget"`

  Expected: FAIL before implementation.

- [x] **Step 3: Implement validation**

  Check capacity before Classic roles; introduce shared budget/roster validation (`Number.isInteger`, minimum 1, comparison with `spent`) and keep state unchanged on error.

- [x] **Step 4: Verify UI**

  Run: `npx playwright test tests/e2e/budget-roster.spec.js`

  Expected: the second over-capacity assignment does not change credits/assignments; a budget below spending shows the error and is not saved.

### Task 3: Protect League Resizing and Team References (P1)

**Files:**
- Modify: `src/domain.js:57-78` — realign `ownTeamId` when the team is removed.
- Modify: `src/app.js:70-73` — always render a valid own team.
- Test: `tests/domain.test.js` — resize with and without purchases by the user's team.
- Create: `tests/e2e/league-resize.spec.js` — shrinking/expanding via the UI.

- [x] **Step 1: Write failing test**

  Set `ownTeamId` to `team-3`, reduce from 3 to 2 teams, and verify that the result points to `team-1` (or the first remaining team) and that no function throws `Squadra non trovata`.

- [x] **Step 2: Run to verify failure**

  Run: `npm test -- --test-name-pattern="ownTeamId|resize"`

  Expected: FAIL because `ownTeamId` remains `team-3`.

- [x] **Step 3: Implement atomic resize**

  After building `teams`, if `ownTeamId` is not present, assign the first remaining team; if a team to be removed has purchases, leave the entire state unchanged.

- [x] **Step 4: Verify**

  Run: `npm test && npx playwright test tests/e2e/league-resize.spec.js`

  Expected: valid resize without errors and a fully atomic rejected resize.

### Task 4: Validate and Isolate Import/Export (P1)

**Files:**
- Modify: `src/storage.js:7-48` — schema validation for teams, ownTeamId, players, and assignments.
- Modify: `src/app.js:113-115` — import into a temporary variable and replace state only after complete validation.
- Test: `tests/storage.test.js` — empty JSON, incomplete schema, missing references, and non-numeric types.
- Create: `tests/e2e/backup.spec.js` — valid export/import and recoverable rejection.

- [x] **Step 1: Write failing tests**

  Import `{version:1,state:{}}` and a state containing an assignment to a nonexistent team; verify that `importState` throws `Backup non valido` and that `loadState` retains the fallback.

- [x] **Step 2: Run to verify failure**

  Run: `npm test -- --test-name-pattern="schema|Backup non valido|fallback"`

  Expected: FAIL because the empty schema is normalized and returned.

- [x] **Step 3: Implement validation**

  Validate at least one team, an existing `ownTeamId`, unique player IDs, existing assignment references, positive prices, and allowed roles; do not mutate the current `state` before committing.

- [x] **Step 4: Verify recovery**

  Run: `npx playwright test tests/e2e/backup.spec.js`

  Expected: accessible alert, no `pageerror`, and the previous state still visible after an invalid import.

### Task 5: Complete the Catalogue, Accessibility, and Continuous Regression Coverage (P2)

**Files:**
- Modify: `src/app.js:60-62,87-89` — show “120 of N” or paginate the catalogue; labels/ARIA for filters and rows.
- Modify: `src/accessibility.css` — minimum touch targets and consistent focus at 390 px.
- Create: `tests/e2e/accessibility-responsive.spec.js` — viewport, focus, semantics, and overflow.
- Modify: `package.json` — `test:e2e` script that starts the server and Playwright.

- [x] **Step 1: Write failing checks**

  Verify that every input has an associated label, that the table states the 120-result limit, and that at 390 px the main controls have a clickable area of at least 44 px.

- [x] **Step 2: Implement UI hardening**

  Add real labels, `aria-selected` on the selected row, an explicit empty state, result indication/pagination, and touch-friendly sizing without changing auction logic.

- [x] **Step 3: Run complete gate**

  Run: `npm test && npm run test:e2e`

  Expected: all regression tests pass in Chromium at 390 px and 1280 px, without `pageerror` or console errors.

## Definition of Done

- [x] The five P0/P1 defects in the QA report have passing automated regression tests.
- [x] `npm test` and `npm run test:e2e` pass with clean state and after a refresh.
- [x] No invalid import changes the current backup.
- [x] The changes introduce no new accessibility violations or responsive overflow.
