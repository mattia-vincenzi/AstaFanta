# Design context

## Intento

Tool operativo locale per un'asta di fantacalcio. Deve essere leggibile rapidamente durante una sessione concitata, con priorità a crediti, disponibilità dei giocatori e composizione delle rose.

## Linguaggio visivo

- Direzione: tabellone d'asta sobrio, compatto e ad alto contrasto.
- Superfici: fondo verde-grigio chiaro, pannelli bianchi, separatori netti senza ombre decorative.
- Colore primario: verde petrolio `#0d5c53`; variante scura `#08423b`.
- Accento funzionale: verde `#177245` per reparti completi, rosso `#a93232` per errori o rimozioni.
- Tipografia: stack di sistema per velocità locale; numeri con cifre tabulari nelle metriche.
- Raggi: 7px per controlli, 10–12px per pannelli. Nessuna card oltre 16px.

## Componenti distintivi

- I badge ruolo sono l'elemento identificativo trasversale a dashboard, rose, strategia e catalogo.
- Classic usa sempre l'ordine `P, D, C, A`, visualizza occupazione/quota e mantiene i quattro ruoli fissi in Strategia.
- Mantra usa i ruoli reali `Por, Dd, Ds, Dc, B, E, M, C, W, T, A, Pc`; la dashboard visualizza soltanto quelli attivati in Strategia.

## Accessibilità e layout

- Focus visibile da tastiera su controlli, righe selezionabili e summary.
- Testo ordinario con contrasto minimo WCAG AA.
- Tabelle dentro contenitori scorrevoli; nessun contenuto deve forzare la larghezza della pagina.
- Dashboard: tre zone su desktop, due sotto 1180px, una sotto 820px.
- Animazioni limitate agli indicatori di avanzamento e disattivate con `prefers-reduced-motion`.
