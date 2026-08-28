# UX contract

## Stato e modalità

- Senza stato salvato viene mostrata la scelta Mantra/Classic.
- La modalità resta immutabile per tutta l'asta; “Nuova asta” richiede conferma e cancella lo stato locale.
- Importazione, refresh ed esportazione mantengono modalità, catalogo modificato, squadre e assegnazioni.

## Asta live

- La ricerca conserva focus e posizione del cursore durante il filtro.
- Una riga selezionata è riconoscibile visivamente e operabile con Invio o Spazio.
- Il ruolo proposto è compatibile con il giocatore; in Classic considera anche gli slot della squadra scelta.
- Un reparto pieno blocca la conferma e mostra la causa prima del submit.
- Ogni azione produce una sola transizione di stato e una conferma accessibile.

## Squadre e strategia

- Il numero di squadre si modifica soltanto nel tab Squadre; non si possono rimuovere squadre con acquisti.
- La Strategia modifica soltanto la squadra impostata come propria.
- In Classic la rosa è sempre 25 con quote 3P/8D/8C/6A; tali valori non sono editabili.
- In Classic minimo, obiettivo e massimo di budget sono configurabili per `P/D/C/A`.
- In Mantra slot e soglie di budget sono configurabili per ogni ruolo reale; i ruoli possono essere aggiunti o rimossi dalla Strategia.

## Azioni distruttive ed errori

- Eliminazione giocatore e nuova asta richiedono conferma.
- I giocatori assegnati non possono essere eliminati dal catalogo.
- Errori di quota, ruolo, dati mancanti o backup invalido restano recuperabili senza perdere lo stato corrente.
