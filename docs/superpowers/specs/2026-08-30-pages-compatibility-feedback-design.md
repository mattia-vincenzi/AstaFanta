# GitHub Pages Compatibility and Interaction Feedback Design

## Scope

Prepare the static application for deployment from the repository root through GitHub Pages using the repository's configured GitHub Actions publishing source, and add a consistent feedback system for successful and failed user actions.

GitHub Pages is already configured by the repository owner with **Source: GitHub Actions**. The application must continue to run from any static HTTP server and from a project subpath such as `/AstaFanta/`.

## Catalogue loading

- Replace JSON import attributes with `fetch()` so browsers that support JavaScript modules but not `import ... with { type: "json" }` can start the app.
- Resolve catalogue URLs relative to `import.meta.url`; never assume the application is hosted at `/`.
- Load the Mantra and Classic catalogues concurrently before restoring or creating auction state.
- Reject non-2xx responses and non-array JSON payloads with an explicit error.
- On total catalogue-loading failure, render an app-owned error surface with the message `Impossibile caricare i cataloghi.` and a `Riprova` button. Retrying must not reload the page or discard local auction data.

## Notification system

The application uses one notification primitive with three semantic tones:

- `success`: a completed save or mutation;
- `error`: a recoverable failure that needs attention;
- `info`: a neutral acknowledgement such as export completion.

Notifications have stable top-right placement on desktop and safe full-width margins on mobile. They do not change the page layout. Success and info messages dismiss automatically after 3.2 seconds; errors remain for 7 seconds. Every notification has a keyboard-accessible dismiss button. A new notification replaces the previous one and resets the dismissal timer, preventing stacks and duplicates.

Success and info notifications use `role="status"` with polite announcement. Errors use `role="alert"`. Toasts acknowledge outcomes but do not replace inline validation where a field can be corrected. Form errors preserve the user's entered values and focus whenever possible.

Required acknowledgement copy:

| Operation | Tone | Message |
|---|---|---|
| Save strategy | success | `Configurazione salvata` |
| Rename team | success | `Nome squadra salvato` |
| Assign player | success | `<name> assegnato per <price> crediti` |
| Remove player | success | `Giocatore rimosso` |
| Undo purchase | success | `Ultimo acquisto annullato` |
| Add/update player | success | `Giocatore salvato` / `Giocatore aggiornato` |
| Delete player | success | `Giocatore eliminato` |
| Import backup | success | `Backup importato` |
| Export backup | info | `Backup esportato` |
| Domain/import error | error | Existing specific error message |

## Press feedback and motion

- Enabled buttons and button-like import labels move down by one pixel and scale to `0.985` while active.
- The press transition lasts at most 100 ms and does not animate layout properties.
- Toast entry uses a short opacity/translate transition.
- Under `prefers-reduced-motion: reduce`, press scaling and toast movement are removed; state changes remain visible without animation.
- Disabled controls never show press feedback.

## Publishing assets

- Add a root `.nojekyll` file.
- Add `.github/workflows/pages.yml`, triggered by pushes to `main` and by manual dispatch.
- Run `npm ci` and `npm test` before packaging the site.
- Publish only `index.html`, `.nojekyll`, and `src/` through a `_site` artifact; repository documentation, tests, example configurations, and development files must not be public site artifacts.
- Scope permissions per job: the build receives `contents: read` and `pages: read`, while deploy receives only `pages: write` and `id-token: write`; deploy through the protected `github-pages` environment.
- Serialize Pages deployments with a `pages` concurrency group without cancelling an in-progress deployment.
- Use the official Pages actions and expose the deployed URL from the deployment step.
- Document GitHub Actions publishing in `README.md` and `README.md.ita`, including a visible link to `https://mattia-vincenzi.github.io/AstaFanta/` in both languages.
- Keep every production asset and module reference relative.

## Verification

- Unit-test catalogue URL resolution, successful concurrent loading, HTTP failure, and invalid JSON shape.
- End-to-end test visible success and error notifications, roles/live regions, dismissal, replacement, keyboard access, and button active feedback.
- Keep existing dialogs only for confirmations; errors must no longer use `alert()`.
- Run all unit and Playwright tests, then smoke-test a Pages-equivalent project-subpath URL and a 390 px viewport with reduced motion.
- Validate the workflow syntax and verify that the staged `_site` tree contains only the intended public files.
