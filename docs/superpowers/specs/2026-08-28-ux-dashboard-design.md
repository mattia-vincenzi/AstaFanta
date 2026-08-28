# UX e dashboard live per Asta Mantra

## Obiettivo

Rendere l'app più leggibile e utile durante l'asta introducendo un Command center: una dashboard che espone immediatamente budget della propria squadra, spesa per ruolo e disponibilità delle altre nove squadre.

## Gerarchia dell'interfaccia

- Testata con nome della propria squadra, budget residuo, spesa totale e slot rimanenti.
- Dashboard in cima alla schermata Asta live, prima del modulo di cessione e del catalogo.
- Sezione propria squadra: carte per ruolo P, D, E, M, C, W, T, A e Pc con speso, obiettivo, residuo e stato di attenzione.
- Sezione altre squadre: tabella compatta ordinata per crediti residui, con speso, giocatori acquistati e slot rimanenti. La propria squadra non compare nella tabella.
- Asta live in secondo piano gerarchico ma senza cambiare il flusso ricerca, selezione dal catalogo e assegnazione.
- Vista Squadre come griglia di carte coerenti: budget residuo dominante, barra di consumo, contatori e rosa espandibile.

## Dati e regole

- I valori derivano dalle assegnazioni esistenti e si aggiornano dopo vendita, annullamento, modifica, importazione e reset.
- La spesa per ruolo considera soltanto le assegnazioni della squadra configurata come propria squadra e il relativo `budgetRole`.
- Il residuo per ruolo usa `obiettivo - spesa`; se un obiettivo non è configurato, mostra solo la spesa.
- Stato visivo: normale entro obiettivo, ambra oltre obiettivo, rosso oltre massimo. Gli avvisi restano non bloccanti.
- Le altre squadre mostrano soltanto dati d'asta reali: nessun confronto strategico o ruolo imposto agli avversari.

## Stile

Palette chiara e sobria, superficie bianca, accento verde petrolio per azioni e selezione, valori numerici grandi e contrastati. Tabelle dense solo dove servono; carte e spazio bianco per lettura immediata.

## Verifica

- Test della somma per ruolo, del filtro che esclude la propria squadra e dell'ordinamento per crediti residui.
- Controllo manuale: una cessione aggiorna dashboard, ruoli e classifica senza ricaricare la pagina.
