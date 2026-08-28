# Tool Asta Mantra Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** correggere i difetti bloccanti rilevati con Playwright e rendere aste, catalogo, budget, squadre e backup coerenti anche nei casi limite.

**Architecture:** mantenere la separazione esistente tra regole pure (`src/domain.js`), normalizzazione/persistenza (`src/storage.js`) e rendering/event handling (`src/app.js`). Ogni correzione deve avere prima una regressione di dominio o Playwright e deve preservare la modalità Mantra/Classic.

**Tech Stack:** JavaScript ES modules, Node test runner, HTML/CSS vanilla, Playwright Chromium.

**Spec:** `docs/superpowers/plans/2026-08-28-qa-test-plan.md` e `UX-CONTRACT.md`.

## Global Constraints

- La modalità dell’asta resta immutabile dopo la creazione.
- Classic conserva rosa 25 e quote P/D/C/A pari a 3/8/8/6.
- Mantra usa esclusivamente i ruoli reali (`Por`, `Dd`, `Ds`, `Dc`, `B`, `E`, `M`, `C`, `W`, `T`, `A`, `Pc`).
- Import invalidi non devono sostituire né corrompere lo stato corrente.
- Ogni azione distruttiva resta confermata e annullabile quando previsto dal contratto UX.

### Task 1: Ripristinare salvataggio e modifica del catalogo (P0)

**Files:**
- Modify: `src/app.js:126` — riconoscimento robusto del form catalogo senza usare `event.target.id` mascherabile dai controlli.
- Modify: `src/app.js:87` — aggiungere label programmatiche ai sei campi del form.
- Test: `tests/render.test.js` — coprire validazione/normalizzazione dei dati inseriti.
- Create: `tests/e2e/catalogue.spec.js` — inserimento e modifica via click e tastiera.

**Interfaces:**
- Consumes: `validatePlayer(setup, player)` da `src/domain.js`.
- Produces: submit catalogo che aggiorna o aggiunge una riga, persiste e richiude il form.

- [x] **Step 1: Write the failing test**

  In Playwright, aprire Catalogo, cliccare “Aggiungi giocatore”, compilare ID `qa-1`, nome `Test`, squadra `QA`, ruolo `M`, quindi cliccare “Salva giocatore”. Assert: esiste una riga `qa-1` dopo il render e dopo un refresh.

- [x] **Step 2: Run test to verify it fails**

  Run: `npx playwright test tests/e2e/catalogue.spec.js -g "inserisce"`

  Expected: FAIL perché il submit handler non entra nel ramo `player-form`.

- [x] **Step 3: Implement minimal fix**

  Usare un riferimento stabile (`event.target.matches('#player-form')` oppure una classe/data attribute non sovrascrivibile), aggiungere `type="submit"` esplicito e associare ogni input a una `<label for>`.

- [x] **Step 4: Run focused verification**

  Run: `npx playwright test tests/e2e/catalogue.spec.js -g "inserisce"`

  Expected: PASS; il record sopravvive al refresh.

- [x] **Step 5: Add edit/delete regressions**

  Verificare modifica di nome/ruolo, ID duplicato rifiutato con stato invariato, eliminazione di un libero con conferma e assenza del pulsante Elimina per un assegnato.

### Task 2: Rendere atomiche rose e budget (P1)

**Files:**
- Modify: `src/domain.js:80-105` — validare capienza totale Mantra e input finanziari.
- Modify: `src/app.js:119-126` — mostrare errori inline e non salvare budget inferiori alla spesa.
- Test: `tests/domain.test.js` — capienza Mantra, budget e valori limite.
- Create: `tests/e2e/budget-roster.spec.js` — flussi UI.

**Interfaces:**
- Consumes: `teamSummary`, `assignPlayer`, `setupRules`.
- Produces: assegnazione rifiutata quando `players >= rosterSize`; budget intero positivo e non inferiore alla spesa senza conferma esplicita.

- [x] **Step 1: Write failing domain tests**

  Creare una rosa Mantra da 1 slot con un acquisto esistente e verificare che `assignPlayer` lanci `Rosa piena`. Creare una squadra con spesa 30 e verificare che l’aggiornamento a budget 1 sia rifiutato.

- [x] **Step 2: Run to verify failure**

  Run: `npm test -- --test-name-pattern="rosa piena|budget"`

  Expected: FAIL prima dell’implementazione.

- [x] **Step 3: Implement validation**

  Controllare la capienza prima dei ruoli Classic; introdurre una validazione comune per budget/roster (`Number.isInteger`, minimo 1, confronto con `spent`) e mantenere lo stato immutato in caso d’errore.

- [x] **Step 4: Verify UI**

  Run: `npx playwright test tests/e2e/budget-roster.spec.js`

  Expected: la seconda assegnazione oltre capienza non cambia crediti/assegnazioni; il budget sotto spesa mostra l’errore e non salva.

### Task 3: Proteggere resize lega e riferimenti squadra (P1)

**Files:**
- Modify: `src/domain.js:57-78` — riallineare `ownTeamId` quando la squadra viene rimossa.
- Modify: `src/app.js:70-73` — renderizzare sempre una squadra propria valida.
- Test: `tests/domain.test.js` — resize con e senza acquisti della squadra propria.
- Create: `tests/e2e/league-resize.spec.js` — riduzione/espansione via UI.

- [x] **Step 1: Write failing test**

  Impostare `ownTeamId` su `team-3`, ridurre da 3 a 2 squadre e verificare che il risultato punti a `team-1` (o alla prima squadra rimasta) e che nessuna funzione lanci `Squadra non trovata`.

- [x] **Step 2: Run to verify failure**

  Run: `npm test -- --test-name-pattern="ownTeamId|resize"`

  Expected: FAIL perché `ownTeamId` resta `team-3`.

- [x] **Step 3: Implement atomic resize**

  Dopo la costruzione di `teams`, se `ownTeamId` non è presente assegnare il primo team rimasto; se una squadra da rimuovere ha acquisti, lasciare invariato l’intero stato.

- [x] **Step 4: Verify**

  Run: `npm test && npx playwright test tests/e2e/league-resize.spec.js`

  Expected: resize valido senza errori e resize vietato completamente atomico.

### Task 4: Validare e isolare import/export (P1)

**Files:**
- Modify: `src/storage.js:7-48` — schema validation di teams, ownTeamId, players e assignments.
- Modify: `src/app.js:113-115` — import in variabile temporanea, sostituzione dello stato solo dopo validazione completa.
- Test: `tests/storage.test.js` — JSON vuoto, schema incompleto, riferimenti mancanti, tipi non numerici.
- Create: `tests/e2e/backup.spec.js` — export/import valido e rifiuto recuperabile.

- [x] **Step 1: Write failing tests**

  Importare `{version:1,state:{}}` e uno stato con assegnazione a team inesistente; verificare che `importState` lanci `Backup non valido` e che `loadState` mantenga il fallback.

- [x] **Step 2: Run to verify failure**

  Run: `npm test -- --test-name-pattern="schema|Backup non valido|fallback"`

  Expected: FAIL perché lo schema vuoto viene normalizzato e restituito.

- [x] **Step 3: Implement validation**

  Validare almeno una squadra, `ownTeamId` esistente, ID giocatore univoci, riferimenti assegnazione esistenti, prezzi positivi e ruoli ammessi; nessuna mutazione del `state` corrente prima del commit.

- [x] **Step 4: Verify recovery**

  Run: `npx playwright test tests/e2e/backup.spec.js`

  Expected: alert accessibile, nessun `pageerror`, stato precedente ancora visibile dopo import invalido.

### Task 5: Complete catalogo, accessibilità e regressione continua (P2)

**Files:**
- Modify: `src/app.js:60-62,87-89` — indicare “120 di N” oppure paginare il catalogo; label/aria per filtri e righe.
- Modify: `src/accessibility.css` — target touch minimi e focus coerente a 390 px.
- Create: `tests/e2e/accessibility-responsive.spec.js` — viewport, focus, semantica e overflow.
- Modify: `package.json` — script `test:e2e` che avvia server e Playwright.

- [x] **Step 1: Write failing checks**

  Verificare che ogni input abbia una label associata, che la tabella dichiari il limite dei 120 risultati e che a 390 px i controlli principali abbiano almeno 44 px di area cliccabile.

- [x] **Step 2: Implement UI hardening**

  Aggiungere label reali, `aria-selected` sulla riga selezionata, stato vuoto esplicito, indicazione/paginazione e dimensioni touch senza alterare la logica d’asta.

- [x] **Step 3: Run complete gate**

  Run: `npm test && npm run test:e2e`

  Expected: tutte le regressioni passano su Chromium a 390 px e 1280 px, senza `pageerror` o errori console.

## Definition of Done

- [x] I cinque difetti P0/P1 del report QA hanno regressioni automatiche verdi.
- [x] `npm test` e `npm run test:e2e` passano con stato pulito e dopo un refresh.
- [x] Nessuna importazione invalida altera il backup corrente.
- [x] Le modifiche non introducono nuove violazioni di accessibilità o overflow responsive.
