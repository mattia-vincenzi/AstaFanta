# Tool Asta Mantra QA Test Plan

**Goal:** Validate Mantra and Classic auction management while preventing inconsistent financial, roster, and backup states.

**Test approach:** Domain tests with `node --test` for pure rules; Playwright end-to-end tests in Chromium for UI transitions, with clean `localStorage` for every scenario; manual smoke tests at desktop and mobile viewports.

**Environment:** macOS, Playwright Chromium, local static server, and catalogues included in the project. Every E2E test must intercept `pageerror`, `dialog`, and console errors; a single occurrence invalidates the scenario unless it is the expected error.

## Regression Gate

- [ ] Run `npm test`; expected result: all domain and storage rules pass.
- [ ] Run the Playwright suite in a clean browser with empty `localStorage`.
- [ ] Run the same flows at 390 px and 1280 px; expected result: no page overflow, reachable controls, and tables scrolling within their own container.
- [ ] Repeat critical actions with the keyboard: Tab/Shift+Tab, Enter, and Space on player rows; expected result: no focus traps and selection/submission equivalent to mouse interaction.

## 1. Startup, Mode, and Persistence

| Case | Data / action | Expected result |
|---|---|---|
| First startup | No `localStorage` | Setup page, with Mantra defaults (10, 1000, 28). |
| Change mode | Select Classic | Values update to 8, 500, and 25, and the button updates. |
| Setup limits | 1 team, empty, decimal; budget 0, negative, empty; empty/whitespace-only name | The browser and domain reject submission; no state is created. |
| Custom setup | Mantra with 2 teams, 750 credits, and a name containing an apostrophe | All teams have 750, the name is escaped, and the user's team is correct. |
| Refresh | Create an auction, modify state, reload | Mode, catalogue, teams, strategy, and assignments remain identical. |
| New auction | Cancel and then confirm the dialog | Cancel does not alter state; confirm clears only the app's key and returns to setup. |

## 2. Live Auction, Filters, and Assignments

| Case | Data / action | Expected result |
|---|---|---|
| Search | Name, team, uppercase/lowercase, leading/trailing spaces, accented characters | Only matching players; focus and cursor remain in the field. |
| No results | Nonexistent query | Empty table with an explicit message and no selectable rows. |
| Role filter | Every Mantra role and Classic P/D/C/A, then reset | Only requested roles; reset restores the unassigned catalogue. |
| Large catalogue | More than 120 results | The count and visible rows are consistent; pagination or a “120 of N” indication is available. |
| Selection | Click, Enter, and Space on a row | Same selection, screen-reader announcement, and a compatible role is proposed. |
| Price | Empty, 0, negative, decimal, text, 1, amount > budget | Does not record non-positive/non-numeric values; any budget overrun follows one explicit policy and does not produce inconsistent balances. |
| Double sale | Confirm the same player twice / double-click | Only one assignment; the player disappears from the unassigned list. |
| Undo and remove | Assign, undo the latest purchase; remove from roster | Credits, slots, dashboard, catalogue, and `localStorage` return to a consistent state. |
| Mantra roster | Set roster to 1, assign 2 players to the same team | The second assignment is blocked; repeat the same check with the standard 28-player roster. |
| Classic quota | Fill P (3), D (8), C (8), A (6), then attempt one additional player per department | Clear message and disabled submission; other roles remain assignable. |

## 3. Teams, Budget, and Participant Count

| Case | Data / action | Expected result |
|---|---|---|
| Rename | Valid name, whitespace only, HTML markup, duplicate | Required and escaped; no loss of team configuration. |
| League expansion | From 2 to 12 in both setups | Unique IDs, unchanged league budget, correct 28/25 slots. |
| Reduction without purchases | Reduce by removing empty teams, including the current user's team | `ownTeamId` is realigned to an existing team. |
| Reduction with purchases | Purchase on the first team to be removed | Atomic rejection: count, teams, and assignments remain unchanged. |
| Strategy budget | Reduce budget below existing spending; clear the field; set 1 and very large values | Budget must be an integer, >= 1 and >= spending, or require explicit confirmation without a silent negative balance. |
| Opponent budgets | Purchases for every team, dashboard sorting | Correct remaining amounts and spending; stable sorting for ties. |

## 4. Strategy

| Case | Data / action | Expected result |
|---|---|---|
| Mantra roles | Remove and re-add each of the 12 roles | Only valid roles; default values consistent with the user's team budget. |
| Mantra thresholds | Min/target/max at 0, large values, max below target/min, max exceeded by a purchase | Consistent validation; readable warning associated with the role. |
| Mantra slots | 0, 1, 28, > roster | Prevents impossible plans or flags them clearly; the auction applies the defined rule. |
| Classic | Change P/D/C/A, attempt to modify slots and roster size | Only min/target/max editable; 3/8/8/6 quotas and 25-player roster immutable. |
| Change user's team | Change team and then reduce the league | Strategy, name, and budget belong to the selected team; no orphan references. |

## 5. Player Catalogue

| Case | Data / action | Expected result |
|---|---|---|
| Insertion | All fields valid, multiple Mantra roles, every Classic role | New row saved and available for filtering/assignment. |
| Validation | Empty ID/name/team/role, invalid role, whitespace, negative or non-numeric Qt/FVM | Recoverable error and unchanged state. |
| ID | Insert a duplicate ID and modify an existing row's ID | Uniqueness error or explicit edit UX; never silent overwrite/duplication. |
| Edit | Correct name, team, roles, Qt, and FVM for unassigned and assigned players | Assignment references remain valid; incompatible roles do not corrupt rosters/quotas. |
| Deletion | Delete unassigned player (cancel/confirm), attempt assigned player | Dialog for the unassigned player; assigned player cannot be deleted or bypassed through the UI. |
| Text XSS | Name/team containing `<script>` and quotation marks | Rendered as text, without execution or broken markup. |

## 6. Backup, Import, and Migrations

| Case | Data / action | Expected result |
|---|---|---|
| Valid export/import | Modified Mantra and Classic state with assignments and strategy | Versioned file; import restores every element without changing mode. |
| Invalid JSON | Broken syntax, empty file, canceled file selection | Recoverable alert, current state intact. |
| Invalid schema | `{version:1,state:{}}`, incorrect types, missing team/player/assignment | Rejected before rendering; no `pageerror` and no corrupted save. |
| Malicious data | String/NaN price, duplicate IDs, assignment to missing team/player, invalid Classic roles | Rejected or normalized with a message; invariants maintained. |
| Legacy migration | Mantra P/D, Classic with a different roster | Migration covered by storage tests; no roles or slots lost. |

## 7. Accessibility, Responsiveness, and Performance

- [ ] Every catalogue input has a programmatic label, not only a placeholder; errors are linked with `aria-describedby` and announced.
- [ ] Player rows are semantically announced controls with `aria-selected` state; tab order and focus remain predictable after every render.
- [ ] All buttons, including `Modifica`, `Elimina`, and `Rimuovi`, have touch targets >= 44×44 px at 390 px.
- [ ] Verify at 390/768/1280 px, 200% zoom, and enlarged text: no clipping of tables, forms, or team names.
- [ ] With the full catalogue, verify fast search: no lost input, no perceptible latency, no console errors.

## Defects Confirmed by Playwright (2026-08-28)

1. **P0 — Catalogue cannot be saved.** `src/app.js:126`: the `event.target.id === 'player-form'` check fails because the `name="id"` field shadows `HTMLFormElement.id`. Clicking and pressing Enter produce zero handled submit events: adding and editing players do not work.
2. **P1 — Mantra roster limit not enforced.** With the roster set to 1, the E2E test recorded 2 players. `assignPlayer` enforces quotas only in Classic.
3. **P1 — Reducing the league can remove the empty user's team.** After team-3 -> 2 teams, state retains the nonexistent `ownTeamId: team-3`; subsequent views can produce `Squadra non trovata`.
4. **P1 — Budget can fall below spending.** In Classic, after spending 30 credits, Strategy accepts a budget of 1 and produces a negative balance without confirmation.
5. **P1 — Backup with invalid schema accepted.** Importing `{version:1,state:{}}` persists the state and produces `pageerror: Squadra non trovata`, contrary to the recoverability contract.

## Recommended Automation

- Extend `tests/domain.test.js` with roster, budget, and `ownTeamId` invariants after `resizeLeague`.
- Extend `tests/storage.test.js` with schema and cross-reference validation.
- Add `tests/e2e/auction.spec.js`, `catalogue.spec.js`, `league.spec.js`, and `backup.spec.js` for the cases in sections 1–6; every confirmed defect must first have a failing test.
- Run `npm test` and the Playwright suite in CI on Chromium before every release.
