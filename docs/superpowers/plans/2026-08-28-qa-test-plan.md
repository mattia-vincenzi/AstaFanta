# Tool Asta Mantra QA Test Plan

**Goal:** validare la gestione dell’asta Mantra e Classic, impedendo stati finanziari, rosa e backup incoerenti.

**Test approach:** test di dominio con `node --test` per le regole pure; test end-to-end Playwright su Chromium per le transizioni UI, con `localStorage` pulito a ogni scenario; smoke manuale a viewport desktop e mobile.

**Environment:** macOS, Chromium Playwright, server statico locale, cataloghi inclusi nel progetto. Ogni test E2E deve intercettare `pageerror`, `dialog` e console error; uno solo invalida lo scenario salvo che sia l’errore atteso.

## Gate di regressione

- [ ] Eseguire `npm test`; risultato atteso: tutte le regole di dominio e storage passano.
- [ ] Eseguire la suite Playwright in un browser pulito con `localStorage` vuoto.
- [ ] Eseguire gli stessi flussi a 390 px e 1280 px; risultato atteso: nessun overflow della pagina, controlli raggiungibili e tabelle con scroll nel proprio contenitore.
- [ ] Ripetere le azioni critiche con tastiera: Tab/Shift+Tab, Invio e Spazio sulle righe giocatore; risultato atteso: nessun trap e selezione/submit equivalenti al mouse.

## 1. Avvio, modalità e persistenza

| Caso | Dati / azione | Risultato atteso |
|---|---|---|
| Primo avvio | Nessun `localStorage` | Pagina setup, Mantra predefinito (10, 1000, 28). |
| Cambio modalità | Selezionare Classic | Valori 8, 500, 25 e pulsante aggiornati. |
| Limiti setup | Squadre 1, vuoto, decimale; budget 0, negativo, vuoto; nome vuoto/spazi | Il browser e il dominio rifiutano il submit; stato assente. |
| Setup custom | Mantra 2 squadre, 750 crediti, nome con apostrofo | Tutte le squadre hanno 750, nome escaped e squadra propria corretta. |
| Refresh | Creare asta, modificare stato, ricaricare | Modalità, catalogo, squadre, strategia e assegnazioni restano identici. |
| Nuova asta | Annullare e poi confermare dialog | Annulla non altera lo stato; conferma pulisce solo la chiave dell’app e torna al setup. |

## 2. Asta live, filtri e assegnazioni

| Caso | Dati / azione | Risultato atteso |
|---|---|---|
| Ricerca | Nome, squadra, maiuscole/minuscole, spazi iniziali/finali, caratteri accentati | Solo i giocatori compatibili; focus e cursore restano nel campo. |
| Nessun risultato | Query inesistente | Tabella vuota con messaggio esplicito e nessuna riga selezionabile. |
| Filtro ruolo | Ogni ruolo Mantra e P/D/C/A Classic, poi reset | Solo ruoli richiesti; reset ripristina il catalogo libero. |
| Catalogo grande | Oltre 120 risultati | Il conteggio e le righe visibili sono coerenti; paginazione o indicazione “120 di N” disponibile. |
| Selezione | Click, Invio e Spazio su una riga | Stessa selezione, annuncio screen-reader e ruolo compatibile proposto. |
| Prezzo | Vuoto, 0, negativo, decimale, testo, 1, importo > budget | Non registra valori non positivi/non numerici; l’eventuale superamento budget segue una sola policy esplicita e non produce saldi incoerenti. |
| Doppia vendita | Confermare due volte lo stesso giocatore / usare doppio click | Una sola assegnazione; il giocatore sparisce dai liberi. |
| Annulla e rimuovi | Assegnare, annullare ultimo acquisto; rimuovere dalla rosa | Crediti, slot, dashboard, catalogo e `localStorage` tornano coerenti. |
| Rosa Mantra | Impostare rosa 1, assegnare 2 giocatori alla stessa squadra | La seconda assegnazione è bloccata; stessa verifica con rosa standard 28. |
| Quota Classic | Riempire P (3), D (8), C (8), A (6), poi tentare un ulteriore giocatore per reparto | Messaggio chiaro e submit disabilitato; altri ruoli restano assegnabili. |

## 3. Squadre, budget e numero partecipanti

| Caso | Dati / azione | Risultato atteso |
|---|---|---|
| Rinomina | Nome valido, solo spazi, markup HTML, duplicato | Obbligatorio e escaped; nessuna perdita delle configurazioni di squadra. |
| Espansione lega | Da 2 a 12 in entrambi i setup | ID univoci, budget della lega invariato, 28/25 slot corretti. |
| Riduzione senza acquisti | Ridurre rimuovendo squadre vuote, inclusa l’attuale squadra propria | `ownTeamId` viene riallineato a una squadra esistente. |
| Riduzione con acquisti | Acquisto nella prima squadra da rimuovere | Rifiuto atomico: numero, squadre e assegnazioni invariati. |
| Budget strategia | Ridurre budget sotto il già speso; svuotare il campo; impostare 1 e valori molto grandi | Il budget deve essere intero, >= 1 e >= spesa o richiedere conferma esplicita senza saldo negativo silenzioso. |
| Budget concorrenti | Acquisti a tutte le squadre, ordinamento dashboard | Residui e spesi corretti; ordinamento stabile a parità. |

## 4. Strategia

| Caso | Dati / azione | Risultato atteso |
|---|---|---|
| Mantra ruoli | Rimuovere e riaggiungere ciascuno dei 12 ruoli | Solo ruoli validi; valori predefiniti coerenti col budget della squadra propria. |
| Soglie Mantra | Min/target/max a 0, valori grandi, max inferiore a target/min, max superato da acquisto | Validazione coerente; warning leggibile e associato al ruolo. |
| Slot Mantra | 0, 1, 28, > rosa | Non consente piani impossibili oppure li segnala chiaramente; l’asta applica la regola definita. |
| Classic | Cambiare P/D/C/A, tentare di modificare slot e dimensione rosa | Solo min/target/max modificabili; quote 3/8/8/6 e rosa 25 immutabili. |
| Cambio squadra propria | Cambiare squadra e poi ridurre la lega | Strategia, nome e budget appartengono alla squadra selezionata; nessun riferimento orfano. |

## 5. Catalogo giocatori

| Caso | Dati / azione | Risultato atteso |
|---|---|---|
| Inserimento | Tutti i campi validi, ruoli multipli Mantra, ogni ruolo Classic | Nuova riga salvata e filtrabile/assegnabile. |
| Validazione | ID/nome/squadra/ruolo vuoti, ruolo non valido, spazi, Qt/FVM negativi o non numerici | Errore recuperabile e stato invariato. |
| ID | Inserire ID duplicato e modificare l’ID di una riga esistente | Errore di unicità oppure UX esplicita di modifica; mai sovrascrittura/duplicazione silenziosa. |
| Modifica | Correggere nome, squadra, ruoli, Qt e FVM di libero e assegnato | I riferimenti dell’assegnazione restano validi; ruoli incompatibili non corrompono rosa/quote. |
| Eliminazione | Cancellare libero (annulla/conferma), tentare assegnato | Dialog per il libero; assegnato non eliminabile né aggirabile dalla UI. |
| XSS testo | Nome/squadra con `<script>` e virgolette | Renderizzato come testo, senza esecuzione né markup rotto. |

## 6. Backup, import e migrazioni

| Caso | Dati / azione | Risultato atteso |
|---|---|---|
| Export/import valido | Stato Mantra e Classic con modifiche, assegnazioni e strategia | File versionato; import ripristina ogni elemento senza cambiare modalità. |
| JSON invalido | Sintassi rotta, file vuoto, annullamento selezione file | Alert recuperabile, stato corrente intatto. |
| Schema invalido | `{version:1,state:{}}`, tipi errati, squadra/giocatore/assegnazione mancanti | Rifiutato prima del render; nessuna `pageerror` e nessun salvataggio corrotto. |
| Dati malevoli | Prezzo stringa/NaN, ID duplicati, assegnazione a team/player assente, ruoli Classic invalidi | Rifiutati o normalizzati con messaggio; invarianti mantenute. |
| Migrazione legacy | Mantra P/D, Classic con roster diverso | Migrazione prevista dai test storage; nessun ruolo o slot perso. |

## 7. Accessibilità, responsive e prestazioni

- [ ] Ogni input del catalogo ha una label programmatica, non solo placeholder; errori collegati con `aria-describedby` e annunciati.
- [ ] Righe giocatore sono controlli semanticamente annunciati, con stato `aria-selected`; tab order e focus dopo ogni render restano prevedibili.
- [ ] Tutti i pulsanti, inclusi `Modifica`, `Elimina` e `Rimuovi`, hanno target touch >= 44×44 px a 390 px.
- [ ] Verificare 390/768/1280 px, zoom 200% e testo ingrandito: no taglio di tabelle, moduli o nomi squadra.
- [ ] Con catalogo completo verificare ricerca rapida: nessun input perso, nessuna latenza percepibile, nessun errore console.

## Difetti confermati da Playwright (2026-08-28)

1. **P0 — Catalogo non salvabile.** `src/app.js:126`: il controllo `event.target.id === 'player-form'` fallisce perché il campo `name="id"` maschera `HTMLFormElement.id`. Click e Invio producono zero eventi di submit gestiti: non funzionano aggiunta e modifica giocatore.
2. **P1 — Limite rosa Mantra non applicato.** Con rosa impostata a 1, l’E2E ha registrato 2 giocatori. `assignPlayer` applica quote solo in Classic.
3. **P1 — Riducendo la lega si può rimuovere la squadra propria vuota.** Dopo team-3 -> 2 squadre, lo stato conserva `ownTeamId: team-3`, che non esiste; le viste successive possono generare `Squadra non trovata`.
4. **P1 — Budget può scendere sotto la spesa.** In Classic, dopo 30 crediti spesi, Strategia accetta budget 1 e produce residuo negativo senza conferma.
5. **P1 — Backup con schema invalido accettato.** Importare `{version:1,state:{}}` persiste lo stato e genera `pageerror: Squadra non trovata`, in contrasto con il contratto di recuperabilità.

## Automazione raccomandata

- Estendere `tests/domain.test.js` con invarianti di rosa, budget e `ownTeamId` dopo `resizeLeague`.
- Estendere `tests/storage.test.js` con validazione di schema e riferimenti incrociati.
- Aggiungere `tests/e2e/auction.spec.js`, `catalogue.spec.js`, `league.spec.js` e `backup.spec.js` per i casi delle sezioni 1–6; ogni difetto confermato deve avere prima un test rosso.
- Eseguire `npm test` e la suite Playwright in CI su Chromium prima di ogni rilascio.
