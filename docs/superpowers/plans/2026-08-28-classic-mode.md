# Classic Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an initial Mantra/Classic setup with independent data, roster rules, and league configuration.

**Architecture:** The domain exposes setup factories and roster constraints; the persisted state retains the selected setup. The interface shows an initial configurator when no auction exists and reuses the dashboard, teams, and catalogue with setup-specific rules.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node test runner, Python/openpyxl for a one-time conversion of player valuations.

**Spec:** `docs/superpowers/specs/2026-08-28-classic-mode-design.md`

## Global Constraints

- Classic: 8 teams, 500 credits, a 25-player roster with 3P/8D/8C/6A.
- Mantra retains the existing defaults, but the number of teams and budget are configurable at startup.
- The setup can be selected only for a new auction; Reset is the only way to change modes.
- Classic uses the R and FVM columns from the player valuations source.

---

### Task 1: Setup factory and Classic constraints

**Files:**
- Modify: `src/domain.js`, `tests/domain.test.js`

**Interfaces:**
- Produces: `createSetup(setup, options)`, `classicSlots(teamAssignments)`, `canAssignClassic(state, assignment)`.

- [ ] **Step 1: Write failing tests for `createSetup('classic')` with 8 teams, a 500 budget, and 25 slots, and for blocking the fourth P.**
- [ ] **Step 2: Run `npm test -- tests/domain.test.js`; verify that it fails because exports are missing.**
- [ ] **Step 3: Implement the Mantra/Classic defaults, configurable budget and team count, and the Classic P/D/C/A quotas.**
- [ ] **Step 4: Run `npm test`; verify that all tests pass.**
- [ ] **Step 5: Commit `git add src/domain.js tests/domain.test.js && git commit -m "feat: add classic league rules"`.**

### Task 2: Classic catalogue and compatible backup

**Files:**
- Create: `src/players-classic.json`, `scripts/build-classic-players.py`
- Modify: `src/storage.js`, `tests/storage.test.js`

- [ ] **Step 1: Write a failing test that a backup without a setup is read as Mantra and that a Classic backup retains `setup: 'classic'`.**
- [ ] **Step 2: Run `npm test -- tests/storage.test.js`; verify that it fails.**
- [ ] **Step 3: Convert A/B/D/E/F/L from the Excel source to Classic JSON; serialize the setup and migrate legacy backups to Mantra.**
- [ ] **Step 4: Run `npm test`; verify that all tests pass.**
- [ ] **Step 5: Commit `git add src/players-classic.json scripts/build-classic-players.py src/storage.js tests/storage.test.js && git commit -m "feat: add classic player catalogue"`.**

### Task 3: Initial configurator and adaptive interface

**Files:**
- Modify: `index.html`, `src/app.js`, `src/ui-system.css`, `tests/render.test.js`

- [ ] **Step 1: Write a failing test for the Classic setup summary text with 8 teams, 500 credits, and a 3P/8D/8C/6A roster.**
- [ ] **Step 2: Run `npm test -- tests/render.test.js`; verify that it fails.**
- [ ] **Step 3: Create a setup selection screen with editable team count, budget, and own-team name fields; create state only on submit.**
- [ ] **Step 4: Adapt the Catalogue, sale, Teams, and dashboard to the setup's roles/slots; Strategy remains limited to the user's own team.**
- [ ] **Step 5: Run `node --check src/app.js && npm test`; verify success.**
- [ ] **Step 6: Commit `git add index.html src/app.js src/ui-system.css tests/render.test.js && git commit -m "feat: add setup selection screen"`.**
