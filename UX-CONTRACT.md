# UX contract

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Table Selection | Selectable rows in `src/app.js` | This contract | Mouse, Enter, Space | `tests/e2e/accessibility-responsive.spec.js` |
| Select/Listbox | Native HTML select | This contract | Platform-managed popup | Playwright Chromium suite |
| Form | Delegated submit and domain validation | `src/domain.js` | Setup, sale, strategy, catalogue | Unit tests and catalogue E2E tests |
| CRUD | Player catalogue | This contract | Unrestricted create, edit, and delete | `tests/e2e/catalogue.spec.js` |

## State and modes

- When there is no saved state, the Mantra/Classic choice is displayed.
- The mode remains immutable throughout the auction; “New auction” requires confirmation and clears local state.
- Importing, refreshing, and exporting preserve the mode, modified catalogue, teams, and assignments.

## Live auction

- Search preserves focus and cursor position while filtering.
- A selected row is visually identifiable and can be operated with Enter or Space.
- The suggested role is compatible with the player; in Classic, it also accounts for the selected team's slots.
- A full department blocks confirmation and displays the reason before submission.
- Each action produces exactly one state transition and an accessible confirmation.

## Teams and strategy

- The number of teams can be changed only in the Teams tab; teams with purchases cannot be removed.
- A team's name can be changed only in the Teams tab; in Strategy, users can select their own team but cannot rename it.
- Strategy modifies only the team designated as the user's own.
- For each role, Strategy allows users to create configurable target tiers with a name, credit range, and free-form player list (one per line); tiers are persisted in backups.
- For each role, the Mantra dashboard also shows the current number of players purchased.
- In Classic, the squad always contains 25 players with quotas of 3P/8D/8C/6A; these values are not editable.
- In Classic, minimum, target, and maximum budgets can be configured for `P/D/C/A`.
- In both modes, role cards use the configured maximum as the denominator: they are green below 80%, yellow from 80% through 100% inclusive, and red when spending exceeds the maximum.
- In Mantra, slots and budget thresholds can be configured for each real role; roles can be added or removed from Strategy.

## Destructive actions and errors

- Deleting a player and starting a new auction require confirmation.
- Assigned players cannot be deleted from the catalogue.
- Quota, role, missing-data, and invalid-backup errors remain recoverable without losing the current state.
