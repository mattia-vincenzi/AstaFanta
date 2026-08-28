# Tool Asta Fantacalcio

Web app locale per gestire un'asta Mantra o Classic. La modalità si sceglie all'avvio di una nuova asta.

- Mantra: default 10 squadre, 1000 crediti e rosa da 28 giocatori.
- Classic: default 8 squadre, 500 crediti e rosa fissa da 3 P, 8 D, 8 C e 6 A.

Numero di squadre e crediti iniziali sono modificabili per entrambe le modalità. Dopo la creazione, il numero dei partecipanti si gestisce nel tab **Squadre**.

In Mantra catalogo, asta e filtri usano tutti i ruoli reali (`Por`, `Dd`, `Ds`, `Dc`, `B`, `E`, `M`, `C`, `W`, `T`, `A`, `Pc`). Nella Strategia Mantra puoi aggiungere o rimuovere i ruoli da pianificare. In Classic i ruoli `P/D/C/A` restano fissi, ma puoi configurare minimo, obiettivo e massimo di budget per ciascuno.

## Avvio

Non richiede installazione di pacchetti. Dalla cartella del progetto:

```bash
python3 -m http.server 8080
```

Apri `http://localhost:8080` nel browser. Non aprire `index.html` con doppio clic: il browser potrebbe bloccare il caricamento del catalogo JSON.

## Dati e backup

I cataloghi iniziali sono `src/players.json` per Mantra e `src/players-classic.json` per Classic. Entrambi possono essere modificati direttamente dalla scheda **Catalogo**. Ogni modifica, assegnazione e impostazione strategica è salvata automaticamente nel browser. Usa **Esporta backup** prima dell'asta e **Importa backup** per ripristinare lo stato in un altro browser.

Le quotazioni Classic provengono da `Quotazioni_Fantacalcio_Stagione_2026_27.xlsx`, usando le colonne `R` per il ruolo e `FVM` per il valore. Il file sorgente non viene incluso nel repository.

## Test

```bash
npm test
```
