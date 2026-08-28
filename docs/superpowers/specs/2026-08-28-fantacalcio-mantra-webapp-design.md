# Web app locale per Asta Fantacalcio Mantra

## Obiettivo

Sostituire il workbook dell'asta con una web app locale, semplice da usare durante un'asta con dieci squadre. L'app gestisce giocatori, assegnazioni e budget senza formule Excel, macro, login o servizi esterni.

## Funzioni

- Asta live: registra una cessione scegliendo giocatore, squadra, prezzo e ruolo budget.
- Giocatori: ricerca, filtri per ruolo Mantra, squadra reale e disponibilità; ordinamento per quotazione, FVM e nome. Il catalogo è modificabile nell'app: si possono aggiungere, correggere ed eliminare giocatori liberi.
- Squadre: riepilogo e rosa delle dieci squadre con budget iniziale, spesa, residuo, giocatori e slot rimanenti.
- Strategia: nome della propria squadra, budget, dimensione rosa e tabella P/D/E/M/C/W/T/A/Pc con slot, minimo, obiettivo e massimo; priorità, tetto e note per giocatore.
- Backup: esportazione e importazione JSON, oltre al ripristino esplicito dei dati iniziali.

## Regole

- Ogni giocatore ha un ID unico e può avere una sola assegnazione.
- Un giocatore assegnato resta modificabile nei dati descrittivi, ma non eliminabile finché l'assegnazione non viene rimossa.
- Ogni squadra inizia con 1000 crediti e 28 slot; i valori restano configurabili.
- Prezzo e squadra sono obbligatori, con prezzo positivo; il ruolo budget deve essere compatibile con il giocatore.
- Il superamento di budget richiede conferma ma non blocca l'asta.
- Gli avvisi della strategia riguardano soltanto la squadra dell'utente e non bloccano l'assegnazione.

## Implementazione e verifica

App client-side in HTML, CSS e JavaScript, con dataset JSON statico e stato salvato in `localStorage`. Sono previsti test automatici per budget, assegnazioni, ruoli e backup, oltre alla verifica manuale dei flussi d'asta e del layout.

## Fuori ambito

Niente autenticazione, collaborazione simultanea, cloud, scraping, asta automatica o produzione Excel.
