# Classic Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere setup iniziale Mantra/Classic con dati, regole rosa e configurazione lega indipendenti.

**Architecture:** Il dominio espone factory di setup e vincoli rosa; lo stato persistito conserva il setup scelto. L'interfaccia mostra un configuratore iniziale quando non esiste un'asta e riusa dashboard, squadre e catalogo con regole specifiche.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node test runner, Python/openpyxl per conversione una tantum delle quotazioni.

**Spec:** `docs/superpowers/specs/2026-08-28-classic-mode-design.md`

## Global Constraints

- Classic: 8 squadre, 500 crediti, rosa 3P/8D/8C/6A da 25 giocatori.
- Mantra mantiene i default esistenti, ma numero squadre e budget sono configurabili all'avvio.
- La scelta setup avviene solo su un'asta nuova; Reset è l'unico cambio modalità.
- Classic usa colonne R e FVM della fonte quotazioni.

---

### Task 1: Factory setup e vincoli Classic

**Files:**
- Modify: `src/domain.js`, `tests/domain.test.js`

**Interfaces:**
- Produces: `createSetup(setup, options)`, `classicSlots(teamAssignments)`, `canAssignClassic(state, assignment)`.

- [ ] **Step 1: Scrivere test fallenti per `createSetup('classic')` con 8 squadre, budget 500 e 25 slot, e per il blocco del quarto P.**
- [ ] **Step 2: Eseguire `npm test -- tests/domain.test.js`; verificare il fallimento degli export mancanti.**
- [ ] **Step 3: Implementare i default Mantra/Classic, budget e numero squadre configurabili, oltre alle quote Classic P/D/C/A.**
- [ ] **Step 4: Eseguire `npm test`; verificare tutti i test verdi.**
- [ ] **Step 5: Commit `git add src/domain.js tests/domain.test.js && git commit -m "feat: add classic league rules"`.**

### Task 2: Catalogo Classic e backup compatibile

**Files:**
- Create: `src/players-classic.json`, `scripts/build-classic-players.py`
- Modify: `src/storage.js`, `tests/storage.test.js`

- [ ] **Step 1: Scrivere test fallente che un backup senza setup venga letto come Mantra e che un backup Classic conservi `setup: 'classic'`.**
- [ ] **Step 2: Eseguire `npm test -- tests/storage.test.js`; verificare il fallimento.**
- [ ] **Step 3: Convertire A/B/D/E/F/L dalla fonte Excel in JSON Classic; serializzare setup e migrare backup legacy a Mantra.**
- [ ] **Step 4: Eseguire `npm test`; verificare tutti i test verdi.**
- [ ] **Step 5: Commit `git add src/players-classic.json scripts/build-classic-players.py src/storage.js tests/storage.test.js && git commit -m "feat: add classic player catalogue"`.**

### Task 3: Configuratore iniziale e interfaccia adattiva

**Files:**
- Modify: `index.html`, `src/app.js`, `src/ui-system.css`, `tests/render.test.js`

- [ ] **Step 1: Scrivere test fallente per il testo del riepilogo setup Classic con 8 squadre, 500 crediti e rosa 3P/8D/8C/6A.**
- [ ] **Step 2: Eseguire `npm test -- tests/render.test.js`; verificare il fallimento.**
- [ ] **Step 3: Creare schermata di scelta setup con campi modificabili numero squadre, budget e nome propria squadra; creare stato soltanto al submit.**
- [ ] **Step 4: Adattare Catalogo, cessione, Squadre e dashboard ai ruoli/slot del setup; Strategy resta solo della propria squadra.**
- [ ] **Step 5: Eseguire `node --check src/app.js && npm test`; verificare successo.**
- [ ] **Step 6: Commit `git add index.html src/app.js src/ui-system.css tests/render.test.js && git commit -m "feat: add setup selection screen"`.**
