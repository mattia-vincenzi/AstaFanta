# Mantra and Classic Setup

## Goal

Allow users to create a new auction by choosing the Mantra or Classic setup once at startup. The choice determines the dataset, roles, initial values, and roster constraints.

## Initial Screen

At startup, when no auction has been configured, the app shows two setups:

- **Mantra:** 10 teams, 1000 credits, 28-player roster; retains the existing Mantra dataset and roles.
- **Classic:** 8 teams, 500 credits, 25-player roster consisting of 3 P, 8 D, 8 C, and 6 A.

Before creating the auction, users can change the following in either setup:

- number of teams, with a minimum of 2;
- initial budget per team, as a positive integer;
- their own team name.

The choice is locked after creation. To change setup, the user selects Reset, which creates a new auction and deletes the current auction's local state after confirmation.

## Classic Data

The Classic catalogue is derived from `Quotazioni_Fantacalcio_Stagione_2026_27.xlsx`:

- `ID`: colonna A;
- Classic role: column B (`R`);
- name: column D;
- team: column E;
- valuation: column F (`Qt.A`);
- FVM: colonna L (`FVM`).

The Classic JSON is static in the app and retains a single role per player. The allowed roles are P, D, C, and A.

## Classic Roster Rules

- Each team has 25 fixed slots: P 3, D 8, C 8, A 6.
- A Classic assignment must use the player's role and cannot exceed that role's slot limit for the purchasing team.
- The dashboard and Team cards show occupancy by role and warn when a category is full.
- Strategic budget configurations remain exclusive to the user's own team; Classic shows only spending and slots by role, without Mantra role budgets.

## Persistence and Compatibility

Local state includes `setup: "mantra" | "classic"`, league configuration, and players for the selected setup. Exported backups include the mode. Backups without a setup are treated as Mantra for compatibility.

## Verification

- Tests for Mantra and Classic defaults, team/budget changes, Classic roles and valuations, Classic slots, and locking the choice after configuration.
- Manual check: select Classic, change teams and budget, assign a goalkeeper, then verify the dashboard and that a fourth goalkeeper is blocked.
