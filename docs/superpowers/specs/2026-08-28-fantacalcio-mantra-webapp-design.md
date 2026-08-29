# Local Web App for a Fantacalcio Mantra Auction

## Goal

Replace the auction workbook with a local web app that is easy to use during a ten-team auction. The app manages players, assignments, and budgets without Excel formulas, macros, login, or external services.

## Features

- Live auction: records a sale by selecting the player, team, price, and budget role.
- Players: search and filters by Mantra role, real-world team, and availability; sorting by valuation, FVM, and name. The catalogue can be edited in the app: unassigned players can be added, corrected, and deleted.
- Teams: summary and roster for all ten teams, including initial budget, spending, remaining budget, players, and remaining slots.
- Strategy: own team name, budget, roster size, and a P/D/E/M/C/W/T/A/Pc table with slots, minimum, target, and maximum; priority, price cap, and notes per player.
- Backup: JSON export and import, plus an explicit reset to the initial data.

## Rules

- Each player has a unique ID and can have only one assignment.
- An assigned player's descriptive data can still be edited, but the player cannot be deleted until the assignment is removed.
- Each team starts with 1000 credits and 28 slots; these values remain configurable.
- Price and team are required, the price must be positive, and the budget role must be compatible with the player.
- Exceeding the budget requires confirmation but does not block the auction.
- Strategy warnings apply only to the user's team and do not block the assignment.

## Implementation and Verification

Client-side app built with HTML, CSS, and JavaScript, using a static JSON dataset and state saved in `localStorage`. Automated tests cover budgets, assignments, roles, and backups, supplemented by manual verification of auction flows and layout.

## Out of Scope

No authentication, real-time collaboration, cloud services, scraping, automated auctions, or Excel output.
