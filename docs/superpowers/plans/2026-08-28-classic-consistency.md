# Classic Mode Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rendere il setup Classic coerente in dominio, dashboard, asta, Squadre, Strategia, catalogo e persistenza, mantenendo configurabili numero di squadre e crediti iniziali e fissando la rosa a 3 P, 8 D, 8 C e 6 A.

**Architecture:** Centralizzare in `src/domain.js` la configurazione dipendente dal setup e derivare da essa ruoli, quote e riepiloghi. `src/app.js` deve limitarsi a renderizzare il modello del dominio e a inoltrare azioni utente tramite un solo handler per azione. `src/storage.js` normalizza i backup prima che raggiungano l'interfaccia.

**Tech Stack:** JavaScript ES modules, HTML/CSS, Node.js built-in test runner, localStorage, JSON catalogues.

**Spec:** `docs/superpowers/specs/2026-08-28-classic-mode-design.md`

## Global Constraints

- Classic usa esclusivamente i ruoli `P`, `D`, `C`, `A` e quote fisse `3/8/8/6`; la dimensione rosa risultante è sempre 25.
- Mantra conserva ruoli, strategia per ruolo e dimensione rosa correnti.
- Numero squadre e budget iniziale sono configurabili in entrambi i setup; aggiungere una squadra deve ereditare la configurazione della lega corrente.
- La Strategia riguarda soltanto la squadra selezionata come propria; non modifica i parametri delle avversarie.
- Un backup privo di `setup` è migrato a Mantra; un backup Classic invalido viene normalizzato senza introdurre ruoli Mantra.
- Ogni correzione parte da un test fallente e termina con l'intera suite verde.

---

### Task 1: Centralizzare configurazione e invarianti dei setup

**Files:**
- Modify: `src/domain.js`
- Modify: `tests/domain.test.js`

**Interfaces:**
- Add: `setupRules(setup)` restituisce ruoli, quote, roster e default della modalità.
- Add: `roleSummaries(state, teamId)` restituisce per ogni ruolo `spent`, `players`, `slots`, `slotsRemaining` e, solo quando presenti, target e massimo strategici.
- Modify: `createSetup`, `resizeLeague`, `assignPlayer`, `ownRoleSummaries`.

- [ ] **Step 1: Scrivere test fallenti per regole Classic `P/D/C/A`, quote `3/8/8/6`, totale 25 e default Mantra invariati.**
- [ ] **Step 2: Scrivere test fallenti per limiti di tutti e quattro i ruoli Classic, rosa complessiva piena e rifiuto di ruoli non Classic.**
- [ ] **Step 3: Scrivere test fallente che l'aumento delle squadre in una lega Classic con budget personalizzato crei squadre con lo stesso budget e 25 slot.**
- [ ] **Step 4: Implementare la configurazione centralizzata e rimuovere i default `1000/28` dal percorso di ridimensionamento.**
- [ ] **Step 5: Implementare riepiloghi di ruolo indipendenti dai budget Mantra e verificare `node --test tests/domain.test.js`.**
- [ ] **Step 6: Commit `git add src/domain.js tests/domain.test.js && git commit -m "fix: centralize classic league rules"`.**

### Task 2: Normalizzare stato locale e backup

**Files:**
- Modify: `src/storage.js`
- Modify: `tests/storage.test.js`
- Modify: `src/app.js`

**Interfaces:**
- Add: `normalizeState(state)` applicata da `importState` e `loadState`.
- Preserve: formato backup versione 1, aggiungendo migrazione compatibile.

- [ ] **Step 1: Scrivere test fallenti per backup legacy senza setup migrato a Mantra e backup Classic che conserva modalità, budget, numero squadre e quote.**
- [ ] **Step 2: Scrivere test fallente per stato Classic incompleto che recupera `classicSlots` e roster 25 senza sostituire il catalogo personalizzato.**
- [ ] **Step 3: Implementare la normalizzazione nello storage e rimuovere la migrazione ad hoc da `src/app.js`.**
- [ ] **Step 4: Rendere il nome del file esportato dipendente dalla modalità (`asta-classic-backup.json` o `asta-mantra-backup.json`).**
- [ ] **Step 5: Verificare `node --test tests/storage.test.js` e commit `git add src/storage.js src/app.js tests/storage.test.js && git commit -m "fix: normalize saved league setup"`.**

### Task 3: Correggere dashboard e intestazione Classic

**Files:**
- Modify: `src/app.js`
- Modify: `src/render.js`
- Modify: `src/ui-system.css`
- Modify: `tests/render.test.js`
- Modify: `src/render.js`

**Interfaces:**
- Add in `src/render.js`: view-model puro per le card ruolo, testabile senza DOM.
- Modify: `header()` e `dashboard()` per usare setup e riepiloghi del dominio.

- [ ] **Step 1: Scrivere test fallenti: Classic espone quattro card nell'ordine `P/D/C/A`, ciascuna con giocatori acquistati, quota e slot residui; Mantra continua a mostrare spesa/target.**
- [ ] **Step 2: Rendere il titolo dell'app e il contesto visivo coerenti con `Asta Classic` o `Asta Mantra`.**
- [ ] **Step 3: In Classic sostituire “crediti al target” con occupazione reale (`2/3 acquistati`, `1 slot libero`) e indicare chiaramente i reparti completi.**
- [ ] **Step 4: Mantenere nel pannello avversarie residuo, spesi e rosa, aggiungendo in Classic una sintesi compatta `P/D/C/A` senza allargare la dashboard.**
- [ ] **Step 5: Verificare responsive layout e assenza di overflow con 4 card Classic e 9 card Mantra; eseguire `node --test tests/render.test.js`.**
- [ ] **Step 6: Commit `git add src/app.js src/render.js src/ui-system.css tests/render.test.js && git commit -m "fix: align dashboard with league mode"`.**

### Task 4: Rendere l'asta live consapevole delle quote Classic

**Files:**
- Modify: `src/app.js`
- Modify: `src/render.js`
- Modify: `tests/render.test.js`
- Modify: `tests/domain.test.js`

**Interfaces:**
- Add: helper puro che restituisce i soli ruoli assegnabili per giocatore e squadra, escludendo gli slot Classic completi.

- [ ] **Step 1: Scrivere test fallenti per selezione di un giocatore Classic, ruolo unico corretto e squadra con reparto pieno.**
- [ ] **Step 2: Mostrare nel form di cessione soltanto ruoli compatibili col giocatore selezionato; in Classic disabilitare la conferma con messaggio esplicito se lo slot della squadra è esaurito.**
- [ ] **Step 3: Conservare ricerca, focus e evidenziazione della riga selezionata durante ogni aggiornamento.**
- [ ] **Step 4: Unificare i due handler `submit` di `sale-form` in un solo percorso, preservando controllo budget, feedback accessibile e persistenza.**
- [ ] **Step 5: Verificare `node --test tests/domain.test.js tests/render.test.js`.**
- [ ] **Step 6: Commit `git add src/app.js src/render.js tests/domain.test.js tests/render.test.js && git commit -m "fix: enforce classic slots in live auction"`.**

### Task 5: Correggere Squadre e Strategia per Classic

**Files:**
- Modify: `src/app.js`
- Modify: `src/ui-system.css`
- Modify: `tests/render.test.js`

**Interfaces:**
- Add in `src/render.js`: view-model per rosa raggruppata per ruolo.
- Modify: `teams()` e `strategy()` con rami espliciti per modalità.

- [ ] **Step 1: Scrivere test fallenti per carta squadra Classic con conteggi `P/D/C/A`, giocatori raggruppati per reparto e reparto completo evidenziato.**
- [ ] **Step 2: Nell'elenco espanso ordinare i giocatori per ruolo e poi nome, mostrando prezzo e badge ruolo in righe compatte; mantenere il pulsante rimozione distinguibile.**
- [ ] **Step 3: In Strategia Classic mostrare solo la propria squadra, budget complessivo, spesa e quote fisse con occupazione; nascondere campi Mantra `min/target/max` e rendere non modificabile la dimensione 25.**
- [ ] **Step 4: In Strategia Mantra conservare configurazione per ruolo e modifica della propria squadra; validare budget e dimensione rosa senza mutare direttamente gli oggetti di `state`.**
- [ ] **Step 5: Nel tab Squadre mantenere il controllo del numero partecipanti per entrambe le modalità e mostrare il default/configurazione corrente senza confonderlo con Strategia.**
- [ ] **Step 6: Eseguire `node --test tests/render.test.js` e commit `git add src/app.js src/render.js src/ui-system.css tests/render.test.js && git commit -m "fix: make teams and strategy mode aware"`.**

### Task 6: Validare il catalogo modificabile per modalità

**Files:**
- Modify: `src/app.js`
- Modify: `src/domain.js`
- Modify: `src/render.js`
- Modify: `tests/domain.test.js`
- Modify: `tests/render.test.js`
- Verify: `scripts/build-classic-players.py`
- Verify: `src/players-classic.json`

**Interfaces:**
- Add: validazione giocatore contro i ruoli ammessi dal setup.

- [ ] **Step 1: Scrivere test fallenti che Classic accetti soltanto `P/D/C/A`, mentre Mantra conserva i ruoli multipli ammessi.**
- [ ] **Step 2: Adattare placeholder, filtro ruolo e form di modifica al setup; prevenire salvataggi Classic con ruoli Mantra.**
- [ ] **Step 3: Verificare con uno script read-only che il JSON Classic derivi dalle colonne Excel `R` e `FVM`, non `RM` e `FVM M`, e che ogni record abbia ID, nome, squadra, ruolo, Qt e FVM validi.**
- [ ] **Step 4: Aggiungere ordinamento per tutte le colonne del catalogo senza perdere filtri o selezione.**
- [ ] **Step 5: Eseguire `npm test` e commit `git add src/app.js src/domain.js src/render.js tests/domain.test.js tests/render.test.js && git commit -m "fix: validate catalogue roles by setup"`.**

### Task 7: Consolidare eventi e verificare i percorsi completi

**Files:**
- Modify: `src/app.js`
- Modify: `tests/render.test.js`
- Modify: `README.md`

**Interfaces:**
- Replace: listener duplicati per reset, selezione giocatore e submit con un solo dispatcher per tipo evento.

- [ ] **Step 1: Aggiungere test di regressione per creazione asta, ridimensionamento, cessione, reset e import, assicurando una sola transizione di stato per azione.**
- [ ] **Step 2: Consolidare gli event listener e rimuovere i rami generici che possono interpretare `setup-form` o `league-size-form` come modifica giocatore.**
- [ ] **Step 3: Aggiornare README con scelta iniziale, default Classic 8/500, rosa 3/8/8/6 e configurabilità di partecipanti/crediti in entrambe le modalità.**
- [ ] **Step 4: Eseguire `npm test` e controllare che tutti i test siano verdi senza warning o errori console.**
- [ ] **Step 5: Avviare la webapp locale e provare manualmente due scenari completi: Classic personalizzato e Mantra personalizzato, inclusi refresh, export/import, aumento squadre e reset.**
- [ ] **Step 6: Controllare desktop e viewport mobile per dashboard, Squadre espanse, Strategia, catalogo e focus ricerca.**
- [ ] **Step 7: Commit `git add src/app.js tests/render.test.js README.md && git commit -m "refactor: consolidate setup-aware interactions"`.**

### Task 8: Verifica finale del branch

**Files:**
- Verify: all modified files

- [ ] **Step 1: Eseguire `npm test` da una working tree pulita e registrare numero di test superati.**
- [ ] **Step 2: Eseguire `git diff main...HEAD --check` e verificare che non esistano errori di whitespace.**
- [ ] **Step 3: Cercare riferimenti UI hard-coded a Mantra (`rg -n "Asta Mantra|M/C|Pc|Dimensione rosa|1000|28" src README.md`) e classificare ogni occorrenza rimasta come intenzionale o correggerla.**
- [ ] **Step 4: Verificare che nessun percorso Classic mostri ruoli diversi da `P/D/C/A` e che nessuna nuova squadra Classic riceva valori Mantra.**
- [ ] **Step 5: Verificare `git status --short` e preparare il branch per revisione senza eseguire merge o push.**
