# Tool Asta Mantra

Web app locale per gestire l'asta di dieci squadre Mantra.

## Avvio

Non richiede installazione di pacchetti. Dalla cartella del progetto:

```bash
python3 -m http.server 8080
```

Apri `http://localhost:8080` nel browser. Non aprire `index.html` con doppio clic: il browser potrebbe bloccare il caricamento del catalogo JSON.

## Dati e backup

Il catalogo iniziale è in `src/players.json` e può essere modificato direttamente dalla scheda **Catalogo**. Ogni modifica, assegnazione e impostazione strategica è salvata automaticamente nel browser. Usa **Esporta backup** prima dell'asta e **Importa backup** per ripristinare lo stato in un altro browser.

Le quotazioni iniziali provengono da `Quotazioni_Fantacalcio_Stagione_2026_27.xlsx`; il file sorgente non viene incluso nel repository.

## Test

```bash
npm test
```
