# Classic Mode Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Classic setup consistent across the domain, dashboard, auction, Teams, Strategy, catalogue, and persistence, while keeping the number of teams and initial credits configurable and fixing the roster at 3 P, 8 D, 8 C, and 6 A.

**Architecture:** Centralize setup-dependent configuration in `src/domain.js` and derive roles, quotas, and summaries from it. `src/app.js` should only render the domain model and forward user actions through a single handler per action. `src/storage.js` normalizes backups before they reach the interface.

**Tech Stack:** JavaScript ES modules, HTML/CSS, Node.js built-in test runner, localStorage, JSON catalogues.

**Spec:** `docs/superpowers/specs/2026-08-28-classic-mode-design.md`

## Global Constraints

- Classic uses only the `P`, `D`, `C`, and `A` roles and fixed `3/8/8/6` quotas; the resulting roster size is always 25.
- Mantra retains its current roles, per-role strategy, and roster size.
- Team count and initial budget are configurable in both setups; adding a team must inherit the current league configuration.
- Strategy applies only to the team selected as the user's own; it does not change opponents' parameters.
- A backup without `setup` is migrated to Mantra; an invalid Classic backup is normalized without introducing Mantra roles.
- Every fix starts with a failing test and ends with the entire suite passing.

---

### Task 1: Centralize Setup Configuration and Invariants

**Files:**
- Modify: `src/domain.js`
- Modify: `tests/domain.test.js`

**Interfaces:**
- Add: `setupRules(setup)` returns the mode's roles, quotas, roster, and defaults.
- Add: `roleSummaries(state, teamId)` returns `spent`, `players`, `slots`, and `slotsRemaining` for each role, plus strategic target and maximum only when present.
- Modify: `createSetup`, `resizeLeague`, `assignPlayer`, `ownRoleSummaries`.

- [ ] **Step 1: Write failing tests for Classic `P/D/C/A` rules, `3/8/8/6` quotas, a total of 25, and unchanged Mantra defaults.**
- [ ] **Step 2: Write failing tests for the limits of all four Classic roles, a full overall roster, and rejection of non-Classic roles.**
- [ ] **Step 3: Write a failing test showing that adding teams to a Classic league with a custom budget creates teams with the same budget and 25 slots.**
- [ ] **Step 4: Implement centralized configuration and remove the `1000/28` defaults from the resizing path.**
- [ ] **Step 5: Implement role summaries independent of Mantra budgets and verify `node --test tests/domain.test.js`.**
- [ ] **Step 6: Commit `git add src/domain.js tests/domain.test.js && git commit -m "fix: centralize classic league rules"`.**

### Task 2: Normalize Local State and Backups

**Files:**
- Modify: `src/storage.js`
- Modify: `tests/storage.test.js`
- Modify: `src/app.js`

**Interfaces:**
- Add: `normalizeState(state)`, applied by `importState` and `loadState`.
- Preserve: version 1 backup format, adding a compatible migration.

- [ ] **Step 1: Write failing tests for a legacy backup without setup migrated to Mantra, and a Classic backup that preserves mode, budget, team count, and quotas.**
- [ ] **Step 2: Write a failing test for incomplete Classic state that restores `classicSlots` and a 25-player roster without replacing the custom catalogue.**
- [ ] **Step 3: Implement normalization in storage and remove the ad hoc migration from `src/app.js`.**
- [ ] **Step 4: Make the exported filename depend on the mode (`asta-classic-backup.json` or `asta-mantra-backup.json`).**
- [ ] **Step 5: Verify `node --test tests/storage.test.js` and commit `git add src/storage.js src/app.js tests/storage.test.js && git commit -m "fix: normalize saved league setup"`.**

### Task 3: Fix the Classic Dashboard and Header

**Files:**
- Modify: `src/app.js`
- Modify: `src/render.js`
- Modify: `src/ui-system.css`
- Modify: `tests/render.test.js`
- Modify: `src/render.js`

**Interfaces:**
- Add in `src/render.js`: a pure view model for role cards, testable without the DOM.
- Modify: `header()` and `dashboard()` to use setup and domain summaries.

- [ ] **Step 1: Write failing tests: Classic exposes four cards in `P/D/C/A` order, each with purchased players, quota, and remaining slots; Mantra continues to show spending/target.**
- [ ] **Step 2: Make the app title and visual context consistent with `Asta Classic` or `Asta Mantra`.**
- [ ] **Step 3: In Classic, replace “credits to target” with actual occupancy (`2/3 purchased`, `1 slot available`) and clearly identify full departments.**
- [ ] **Step 4: Keep remaining budget, spending, and roster in the opponents panel, adding a compact `P/D/C/A` summary in Classic without widening the dashboard.**
- [ ] **Step 5: Verify the responsive layout and absence of overflow with 4 Classic cards and 9 Mantra cards; run `node --test tests/render.test.js`.**
- [ ] **Step 6: Commit `git add src/app.js src/render.js src/ui-system.css tests/render.test.js && git commit -m "fix: align dashboard with league mode"`.**

### Task 4: Make the Live Auction Aware of Classic Quotas

**Files:**
- Modify: `src/app.js`
- Modify: `src/render.js`
- Modify: `tests/render.test.js`
- Modify: `tests/domain.test.js`

**Interfaces:**
- Add: a pure helper that returns only assignable roles for a player and team, excluding full Classic slots.

- [ ] **Step 1: Write failing tests for selecting a Classic player, the correct single role, and a team with a full department.**
- [ ] **Step 2: Show only roles compatible with the selected player in the sale form; in Classic, disable confirmation with an explicit message if the team's slot is full.**
- [ ] **Step 3: Preserve search, focus, and selected-row highlighting during every update.**
- [ ] **Step 4: Unify the two `sale-form` `submit` handlers into a single path while preserving budget checks, accessible feedback, and persistence.**
- [ ] **Step 5: Verify `node --test tests/domain.test.js tests/render.test.js`.**
- [ ] **Step 6: Commit `git add src/app.js src/render.js tests/domain.test.js tests/render.test.js && git commit -m "fix: enforce classic slots in live auction"`.**

### Task 5: Fix Teams and Strategy for Classic

**Files:**
- Modify: `src/app.js`
- Modify: `src/ui-system.css`
- Modify: `tests/render.test.js`

**Interfaces:**
- Add in `src/render.js`: a view model for a roster grouped by role.
- Modify: `teams()` and `strategy()` with explicit branches by mode.

- [ ] **Step 1: Write failing tests for a Classic team card with `P/D/C/A` counts, players grouped by department, and the full department highlighted.**
- [ ] **Step 2: In the expanded list, sort players by role and then name, showing price and role badges in compact rows; keep the remove button distinguishable.**
- [ ] **Step 3: In Classic Strategy, show only the user's team, overall budget, spending, and fixed quotas with occupancy; hide Mantra `min/target/max` fields and make the size of 25 read-only.**
- [ ] **Step 4: In Mantra Strategy, retain per-role configuration and editing of the user's team; validate budget and roster size without directly mutating `state` objects.**
- [ ] **Step 5: In the Teams tab, retain control of the participant count for both modes and show the current default/configuration without confusing it with Strategy.**
- [ ] **Step 6: Run `node --test tests/render.test.js` and commit `git add src/app.js src/render.js src/ui-system.css tests/render.test.js && git commit -m "fix: make teams and strategy mode aware"`.**

### Task 6: Validate the Editable Catalogue by Mode

**Files:**
- Modify: `src/app.js`
- Modify: `src/domain.js`
- Modify: `src/render.js`
- Modify: `tests/domain.test.js`
- Modify: `tests/render.test.js`
- Verify: `scripts/build-classic-players.py`
- Verify: `src/players-classic.json`

**Interfaces:**
- Add: player validation against the roles allowed by the setup.

- [ ] **Step 1: Write failing tests showing that Classic accepts only `P/D/C/A`, while Mantra retains its allowed multiple roles.**
- [ ] **Step 2: Adapt the placeholder, role filter, and edit form to the setup; prevent Classic saves with Mantra roles.**
- [ ] **Step 3: Use a read-only script to verify that the Classic JSON derives from Excel columns `R` and `FVM`, not `RM` and `FVM M`, and that every record has valid ID, name, team, role, Qt, and FVM values.**
- [ ] **Step 4: Add sorting for all catalogue columns without losing filters or selection.**
- [ ] **Step 5: Run `npm test` and commit `git add src/app.js src/domain.js src/render.js tests/domain.test.js tests/render.test.js && git commit -m "fix: validate catalogue roles by setup"`.**

### Task 7: Consolidate Events and Verify Complete Flows

**Files:**
- Modify: `src/app.js`
- Modify: `tests/render.test.js`
- Modify: `README.md`

**Interfaces:**
- Replace: duplicate listeners for reset, player selection, and submit with a single dispatcher per event type.

- [ ] **Step 1: Add regression tests for auction creation, resizing, sale, reset, and import, ensuring exactly one state transition per action.**
- [ ] **Step 2: Consolidate event listeners and remove generic branches that can interpret `setup-form` or `league-size-form` as a player edit.**
- [ ] **Step 3: Update the README with the initial choice, Classic 8/500 defaults, the 3/8/8/6 roster, and configurable participants/credits in both modes.**
- [ ] **Step 4: Run `npm test` and check that all tests pass without warnings or console errors.**
- [ ] **Step 5: Start the local web app and manually test two complete scenarios: custom Classic and custom Mantra, including refresh, export/import, adding teams, and reset.**
- [ ] **Step 6: Check desktop and mobile viewports for the dashboard, expanded Teams, Strategy, catalogue, and search focus.**
- [ ] **Step 7: Commit `git add src/app.js tests/render.test.js README.md && git commit -m "refactor: consolidate setup-aware interactions"`.**

### Task 8: Final Branch Verification

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run `npm test` from a clean working tree and record the number of passing tests.**
- [ ] **Step 2: Run `git diff main...HEAD --check` and verify that there are no whitespace errors.**
- [ ] **Step 3: Search for hard-coded Mantra UI references (`rg -n "Asta Mantra|M/C|Pc|Dimensione rosa|1000|28" src README.md`) and classify each remaining occurrence as intentional or fix it.**
- [ ] **Step 4: Verify that no Classic flow shows roles other than `P/D/C/A` and that no new Classic team receives Mantra values.**
- [ ] **Step 5: Verify `git status --short` and prepare the branch for review without merging or pushing.**
