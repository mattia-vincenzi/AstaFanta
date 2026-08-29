# UX and Live Dashboard for the Mantra Auction

## Goal

Make the app easier to read and more useful during the auction by introducing a Command Center: a dashboard that immediately shows the user's team budget, spending by role, and the availability of the other nine teams.

## Interface Hierarchy

- Header with the user's team name, remaining budget, total spending, and remaining slots.
- Dashboard at the top of the Live Auction screen, before the sale form and catalogue.
- Own-team section: cards for roles P, D, E, M, C, W, T, A, and Pc showing spent, target, remaining amount, and warning state.
- Other-teams section: a compact table sorted by remaining credits, showing spending, players purchased, and remaining slots. The user's team does not appear in the table.
- Live Auction has secondary visual priority without changing the search, catalogue selection, and assignment flow.
- Teams view as a consistent card grid: prominent remaining budget, usage bar, counters, and expandable roster.

## Data and Rules

- Values are derived from existing assignments and update after a sale, cancellation, edit, import, or reset.
- Spending by role includes only assignments for the team configured as the user's own team and their corresponding `budgetRole`.
- Remaining budget by role uses `target - spending`; if no target is configured, only spending is shown.
- Visual state: normal at or below target, amber above target, red above maximum. Warnings remain non-blocking.
- Other teams show only actual auction data: no strategic comparisons or roles imposed on opponents.

## Style

Light, understated palette, white surfaces, and a teal accent for actions and selections, with large, high-contrast numeric values. Dense tables only where needed; cards and whitespace for immediate readability.

## Verification

- Test the sum by role, the filter that excludes the user's team, and sorting by remaining credits.
- Manual check: a sale updates the dashboard, roles, and standings without reloading the page.
