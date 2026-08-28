# Setup Mantra e Classic

## Obiettivo

Consentire la creazione di una nuova asta scegliendo, una sola volta all'avvio, il setup Mantra o Classic. La scelta determina dataset, ruoli, valori iniziali e vincoli della rosa.

## Schermata iniziale

All'avvio senza un'asta configurata, l'app mostra due setup:

- **Mantra:** 10 squadre, 1000 crediti, rosa da 28; conserva il dataset e i ruoli Mantra esistenti.
- **Classic:** 8 squadre, 500 crediti, rosa da 25 composta da 3 P, 8 D, 8 C e 6 A.

Prima di creare l'asta, in entrambi i setup l'utente può modificare:

- numero di squadre, con minimo 2;
- budget iniziale per squadra, intero positivo;
- nome della propria squadra.

La scelta è bloccata dopo la creazione. Per cambiare setup l'utente usa Reset, che crea una nuova asta e cancella lo stato locale dell'asta corrente dopo conferma.

## Dati Classic

Il catalogo Classic deriva da `Quotazioni_Fantacalcio_Stagione_2026_27.xlsx`:

- `ID`: colonna A;
- ruolo Classic: colonna B (`R`);
- nome: colonna D;
- squadra: colonna E;
- quotazione: colonna F (`Qt.A`);
- FVM: colonna L (`FVM`).

Il JSON Classic è statico nell'app e conserva un solo ruolo per giocatore. I ruoli ammessi sono P, D, C e A.

## Regole della rosa Classic

- Ogni squadra ha 25 slot fissi: P 3, D 8, C 8, A 6.
- Un'assegnazione Classic deve usare il ruolo del giocatore e non può superare lo slot di quel ruolo per la squadra acquirente.
- Dashboard e carte Squadre mostrano occupazione per ruolo e avvisano quando una categoria è completa.
- Le configurazioni strategiche di budget rimangono una funzione della sola propria squadra; Classic mostra solo spesa e slot per ruolo, senza budget Mantra per ruolo.

## Persistenza e compatibilità

Lo stato locale include `setup: "mantra" | "classic"`, configurazione lega e giocatori del setup scelto. I backup esportati includono la modalità. I backup privi di setup vengono trattati come Mantra per compatibilità.

## Verifica

- Test per default Mantra e Classic, modifica di squadre/budget, ruolo e quote Classic, slot Classic e blocco della scelta dopo configurazione.
- Controllo manuale: scegliere Classic, modificare squadre e budget, assegnare un portiere, verificare dashboard e blocco del quarto portiere.
