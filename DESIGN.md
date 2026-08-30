# Design context

## Intent

A local operational tool for a fantasy football auction. It must be easy to scan during a fast-paced session, prioritizing credits, player availability, and squad composition.

## Visual language

- Direction: understated, compact, high-contrast auction board.
- Surfaces: light green-gray background, white panels, and crisp separators without decorative shadows.
- Primary color: petrol green `#0d5c53`; dark variant `#08423b`.
- Functional accent: green `#177245` for complete departments, red `#a93232` for errors or removals.
- Typography: system stack for fast local rendering; tabular figures for metrics.
- Radii: 7px for controls, 10–12px for panels. No card above 16px.

## Distinctive components

- Role badges are the identifying element used consistently across the dashboard, squads, strategy, and catalogue.
- Outcome notifications are a single compact top-right layer: green for success, petrol blue for information, and red for recoverable errors. They never shift the auction layout or stack.
- Enabled controls move down one pixel and scale slightly while pressed, echoing the physical rhythm of an auction desk without slowing interaction.
- Classic always uses the order `P, D, C, A`, displays occupancy/quota, and keeps the four roles fixed in Strategy.
- Mantra uses the real roles `Por, Dd, Ds, Dc, B, E, M, C, W, T, A, Pc`; the dashboard displays only those enabled in Strategy.

## Accessibility and layout

- Visible keyboard focus on controls, selectable rows, and summary elements.
- Body text with at least WCAG AA contrast.
- Tables inside scrollable containers; no content may force the page width.
- Dashboard: three regions on desktop, two below 1180px, and one below 820px.
- Animations are limited to progress indicators, button press feedback, and the short notification entrance. Press transforms and notification movement are disabled with `prefers-reduced-motion`.
