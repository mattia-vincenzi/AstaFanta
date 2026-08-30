# GitHub Pages Compatibility and Interaction Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make catalogue loading compatible with GitHub Pages and older module-capable browsers while adding accessible success, information, and error feedback throughout the app.

**Architecture:** Move catalogue fetching and validation into a small `src/catalogues.js` boundary and start the existing app through an asynchronous bootstrap. Keep one notification state in `src/app.js`, render it through a shared primitive, and style its semantic tones and button press states in the canonical UI stylesheet. A least-privilege GitHub Actions workflow tests the project, stages only runtime files, uploads the Pages artifact, and deploys it through the `github-pages` environment.

**Tech Stack:** Static HTML/CSS, native ES modules, Fetch API, Node test runner, Playwright Chromium, GitHub Pages branch publishing.

**Spec:** `docs/superpowers/specs/2026-08-30-pages-compatibility-feedback-design.md`

## Global Constraints

- Do not add runtime or build dependencies.
- Deploy Pages from GitHub Actions on pushes to `main` and manual dispatch; publish only `index.html`, `.nojekyll`, and `src/`.
- Link the published application as `https://mattia-vincenzi.github.io/AstaFanta/` from both README versions.
- Resolve production URLs relative to `import.meta.url`, never `/`.
- Keep UI copy in Italian and documentation in English, except `README.md.ita`.
- Use one notification system with `success`, `info`, and `error` tones; never introduce screen-local toast variants.
- Keep confirmation dialogs for destructive decisions, but replace error `alert()` calls with recoverable notifications.
- Success/info timeout: 3,200 ms. Error timeout: 7,000 ms.
- Preserve keyboard focus, user-entered form values, local storage state, and reduced-motion behavior.
- Use the existing runtime token system in `src/ui-system.css` as canonical; do not introduce independent raw color palettes.

---

### Task 1: Fetch and validate both catalogues from relative module URLs

**Files:**
- Create: `src/catalogues.js`
- Create: `tests/catalogues.test.js`

**Interfaces:**
- Produces: `loadCatalogue(url: URL, fetchImpl: typeof fetch): Promise<Array<object>>`.
- Produces: `loadCatalogues(fetchImpl?: typeof fetch, moduleUrl?: string): Promise<{ mantraPlayers: Array<object>, classicPlayers: Array<object> }>`.
- Consumes: native `fetch`, `URL`, and JSON array payloads.

- [ ] **Step 1: Write failing unit tests for URL resolution, successful loading, HTTP errors, and invalid payloads**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCatalogues } from '../src/catalogues.js';

test('loads both catalogues relative to the app module under a project subpath', async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(String(url));
    return { ok: true, json: async () => [{ id: String(requested.length) }] };
  };

  const result = await loadCatalogues(fetchImpl, 'https://example.github.io/AstaFanta/src/app.js');

  assert.deepEqual(requested, [
    'https://example.github.io/AstaFanta/src/players.json',
    'https://example.github.io/AstaFanta/src/players-classic.json',
  ]);
  assert.equal(result.mantraPlayers.length, 1);
  assert.equal(result.classicPlayers.length, 1);
});

test('rejects an unsuccessful catalogue response', async () => {
  await assert.rejects(
    loadCatalogues(async () => ({ ok: false, status: 404 }), 'https://example.test/src/app.js'),
    /Catalogo non disponibile \(404\)/,
  );
});

test('rejects a catalogue whose JSON root is not an array', async () => {
  await assert.rejects(
    loadCatalogues(async () => ({ ok: true, json: async () => ({ players: [] }) }), 'https://example.test/src/app.js'),
    /Formato catalogo non valido/,
  );
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `node --test tests/catalogues.test.js`

Expected: FAIL because `src/catalogues.js` does not exist.

- [ ] **Step 3: Implement the minimal catalogue boundary**

```js
export async function loadCatalogue(url, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Catalogo non disponibile (${response.status})`);
  const players = await response.json();
  if (!Array.isArray(players)) throw new Error('Formato catalogo non valido');
  return players;
}

export async function loadCatalogues(fetchImpl = fetch, moduleUrl = import.meta.url) {
  const [mantraPlayers, classicPlayers] = await Promise.all([
    loadCatalogue(new URL('./players.json', moduleUrl), fetchImpl),
    loadCatalogue(new URL('./players-classic.json', moduleUrl), fetchImpl),
  ]);
  return { mantraPlayers, classicPlayers };
}
```

- [ ] **Step 4: Run the focused and full unit suites**

Run: `node --test tests/catalogues.test.js && npm test`

Expected: catalogue tests pass and all existing unit tests remain green.

- [ ] **Step 5: Commit the catalogue loader boundary**

```bash
git add src/catalogues.js tests/catalogues.test.js
git commit -m "feat: load catalogues through relative fetch"
```

---

### Task 2: Bootstrap the application asynchronously with a recoverable loading failure

**Files:**
- Modify: `src/app.js:1-31,99-109,152`
- Create: `tests/e2e/catalogue-loading.spec.js`

**Interfaces:**
- Consumes: `loadCatalogues()` from Task 1.
- Produces: `bootstrap(): Promise<void>` and `renderCatalogueLoadError(): void` within `src/app.js`.
- Preserves: existing state restoration, setup creation, event delegation, and `catalogueForSetup()` behavior.

- [ ] **Step 1: Write failing E2E coverage for normal startup and retryable catalogue failure**

```js
import { expect, test } from '@playwright/test';

test('starts with catalogues fetched below a Pages project path', async ({ page }) => {
  const catalogues = [];
  page.on('request', (request) => {
    if (request.url().endsWith('players.json') || request.url().endsWith('players-classic.json')) catalogues.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Crea asta Mantra' })).toBeVisible();
  expect(catalogues).toHaveLength(2);
});

test('shows a recoverable error and retries catalogue loading', async ({ page }) => {
  let failRequests = true;
  await page.route(/players(?:-classic)?\.json$/, async (route) => {
    if (failRequests) {
      await route.fulfill({ status: 503, body: 'temporarily unavailable' });
    } else {
      await route.continue();
    }
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Impossibile caricare i cataloghi.');
  failRequests = false;
  await page.getByRole('button', { name: 'Riprova' }).click();
  await expect(page.getByRole('button', { name: 'Crea asta Mantra' })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused E2E test and confirm RED**

Run: `npx playwright test tests/e2e/catalogue-loading.spec.js --project=chromium --reporter=line`

Expected: FAIL because startup still uses JSON import attributes and no retry surface exists.

- [ ] **Step 3: Replace JSON imports with asynchronous bootstrap**

At the top of `src/app.js`, import only the loader and use mutable catalogue bindings:

```js
import { loadCatalogues } from './catalogues.js';

let mantraPlayers = [];
let classicPlayers = [];
let state = null;
```

Move `loadState()` and Classic compatibility normalization into:

```js
async function bootstrap() {
  root.innerHTML = '<main class="setup-screen"><p role="status">Caricamento cataloghi…</p></main>';
  const catalogues = await loadCatalogues();
  mantraPlayers = catalogues.mantraPlayers;
  classicPlayers = catalogues.classicPlayers;
  state = loadState(localStorage, null);
  if (state) {
    const compatiblePlayers = catalogueForSetup(state.setup, state.players, classicPlayers);
    if (compatiblePlayers !== state.players) {
      state = { ...state, players: compatiblePlayers };
      saveState(localStorage, state);
    }
  }
  render();
}

function renderCatalogueLoadError() {
  document.title = 'Cataloghi non disponibili';
  root.innerHTML = '<main class="setup-screen"><section class="panel load-error" role="alert"><h1>Impossibile caricare i cataloghi.</h1><p>Controlla la connessione e riprova.</p><button data-action="retry-catalogues">Riprova</button></section></main>';
}
```

Add delegated retry handling before state-dependent click branches and replace the final `render()` with:

```js
bootstrap().catch(renderCatalogueLoadError);
```

- [ ] **Step 4: Run startup tests, then all E2E smoke tests**

Run: `npx playwright test tests/e2e/catalogue-loading.spec.js tests/e2e/backup.spec.js --project=chromium --reporter=line`

Expected: both catalogue-loading tests and existing backup flows pass without console errors.

- [ ] **Step 5: Commit the bootstrap migration**

```bash
git add src/app.js tests/e2e/catalogue-loading.spec.js
git commit -m "feat: add retryable catalogue bootstrap"
```

---

### Task 3: Add the canonical accessible notification primitive

**Files:**
- Create: `src/notifications.js`
- Create: `tests/notifications.test.js`
- Modify: `src/app.js:22-35,99-110`
- Modify: `UX-CONTRACT.md:3-10,38-42`

**Interfaces:**
- Produces: `createNotification(tone: 'success'|'info'|'error', message: string, id?: number): Notification`.
- Produces: `renderNotification(notification: Notification|null, escapeHtml: (value: unknown) => string): string` for the contents of the persistent notification region.
- Consumes: `showNotification(tone, message)`, `paintNotification()`, and `dismissNotification()` functions owned by `src/app.js`.

- [ ] **Step 1: Write failing unit tests for semantic markup and escaped copy**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotification, renderNotification } from '../src/notifications.js';

const escapeHtml = (value) => String(value).replaceAll('<', '&lt;').replaceAll('>', '&gt;');

test('renders success as a polite status and error as an alert', () => {
  const success = renderNotification(createNotification('success', 'Configurazione salvata', 1), escapeHtml);
  const error = renderNotification(createNotification('error', 'Backup <non valido>', 2), escapeHtml);
  assert.match(success, /role="status"/);
  assert.match(success, /data-tone="success"/);
  assert.match(error, /role="alert"/);
  assert.match(error, /Backup &lt;non valido&gt;/);
  assert.match(error, /aria-label="Chiudi notifica"/);
});

test('rejects unsupported tones', () => {
  assert.throws(() => createNotification('warning', 'No'), /Tono notifica non valido/);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/notifications.test.js`

Expected: FAIL because `src/notifications.js` does not exist.

- [ ] **Step 3: Implement the notification value and markup functions**

```js
const TONES = new Set(['success', 'info', 'error']);

export function createNotification(tone, message, id = Date.now()) {
  if (!TONES.has(tone)) throw new Error('Tono notifica non valido');
  return { id, tone, message: String(message) };
}

export function renderNotification(notification, escapeHtml) {
  if (!notification) return '';
  const role = notification.tone === 'error' ? 'alert' : 'status';
  return `<aside class="notification" data-tone="${notification.tone}" role="${role}" aria-atomic="true"><span>${escapeHtml(notification.message)}</span><button type="button" class="notification-dismiss" data-action="dismiss-notification" aria-label="Chiudi notifica">×</button></aside>`;
}
```

- [ ] **Step 4: Integrate one notification state and deterministic timer ownership into `src/app.js`**

```js
import { createNotification, renderNotification } from './notifications.js';

let notification = null;
let notificationTimer = null;

function paintNotification() {
  const region = document.querySelector('.notification-region');
  if (region) region.innerHTML = renderNotification(notification, escape);
}

function dismissNotification() {
  clearTimeout(notificationTimer);
  notificationTimer = null;
  notification = null;
  paintNotification();
}

function showNotification(tone, message) {
  clearTimeout(notificationTimer);
  notification = createNotification(tone, message);
  paintNotification();
  const timeout = tone === 'error' ? 7000 : 3200;
  notificationTimer = setTimeout(dismissNotification, timeout);
}
```

Keep one persistent `<div class="notification-region" aria-live="polite"></div>` in both rendered application shells, handle `data-action="dismiss-notification"` before state-dependent actions, and add the notification system to the Canonical UI Map and error policy in `UX-CONTRACT.md`. Updating a notification must repaint only this region so form values and focus are preserved.

- [ ] **Step 5: Run unit tests and confirm GREEN**

Run: `node --test tests/notifications.test.js && npm test`

Expected: notification tests pass and existing unit tests remain green.

- [ ] **Step 6: Commit the primitive and contract**

```bash
git add src/notifications.js tests/notifications.test.js src/app.js UX-CONTRACT.md
git commit -m "feat: add accessible notification system"
```

---

### Task 4: Route application outcomes and errors through the notification system

**Files:**
- Modify: `src/app.js:110-150`
- Modify: `tests/e2e/backup.spec.js`
- Modify: `tests/e2e/budget-roster.spec.js`
- Modify: `tests/e2e/catalogue.spec.js`
- Create: `tests/e2e/notifications.spec.js`

**Interfaces:**
- Consumes: `showNotification()` and `dismissNotification()` from Task 3.
- Produces: one consistent notification outcome for every saved mutation and recoverable error.
- Preserves: `confirm()` only for destructive decisions and negative-budget override.

- [ ] **Step 1: Write failing E2E tests for save, replacement, dismissal, and error recovery**

```js
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
});

test('announces saved configuration and allows keyboard dismissal', async ({ page }) => {
  await page.getByRole('button', { name: 'Strategia' }).click();
  await page.getByRole('button', { name: 'Salva configurazione' }).click();
  const notice = page.getByRole('status');
  await expect(notice).toContainText('Configurazione salvata');
  const dismiss = page.getByRole('button', { name: 'Chiudi notifica' });
  await dismiss.focus();
  await dismiss.press('Enter');
  await expect(page.getByText('Configurazione salvata')).toHaveCount(0);
});

test('replaces the current notification instead of stacking', async ({ page }) => {
  await page.getByRole('button', { name: 'Strategia' }).click();
  await page.getByRole('button', { name: 'Salva configurazione' }).click();
  await page.getByRole('button', { name: 'Squadre' }).click();
  const ownTeam = page.locator('.team-card').first();
  await ownTeam.getByLabel('Nome squadra').fill('Nuovo nome');
  await ownTeam.getByRole('button', { name: 'Salva' }).click();
  await expect(page.locator('.notification')).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('Nome squadra salvato');
});

test('shows invalid backup as a recoverable alert without a native error dialog', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', (dialog) => dialogs.push(dialog.type()));
  await page.locator('input[data-action="import"]').setInputFiles({
    name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"invalid":true}'),
  });
  await expect(page.getByRole('alert')).toContainText('Backup non valido');
  expect(dialogs).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Asta Mantra' })).toBeVisible();
});
```

- [ ] **Step 2: Run notification and affected legacy tests to confirm RED**

Run: `npx playwright test tests/e2e/notifications.spec.js tests/e2e/backup.spec.js tests/e2e/budget-roster.spec.js --project=chromium --reporter=line`

Expected: new tests fail because save actions do not show visible notifications and errors still call `alert()`.

- [ ] **Step 3: Add explicit success/info acknowledgements to every mutation**

Use the approved copy table from the spec. Representative changes:

```js
if (target.dataset.action === 'undo') {
  state = { ...state, assignments: state.assignments.slice(0, -1) };
  persist();
  render();
  showNotification('success', 'Ultimo acquisto annullato');
  return;
}

if (formId === 'strategy-form') {
  // existing state update
  persist();
  render();
  showNotification('success', 'Configurazione salvata');
  return;
}
```

State-changing actions retain the explicit order `mutate -> persist -> render -> showNotification`, because a full render recreates the empty notification region. Actions that do not mutate visible state call `showNotification()` directly. Set the precise messages listed in the spec for rename, assignment, player removal, player save/update/delete, import, and export.

- [ ] **Step 4: Replace native error alerts while preserving editable form state**

```js
if (event.target.dataset.action === 'import') {
  try {
    // existing import
    showNotification('success', 'Backup importato');
  } catch {
    event.target.value = '';
    showNotification('error', 'Backup non valido');
  }
}

// submit catch
catch (error) {
  showNotification('error', error.message);
  event.target.querySelector(':invalid')?.focus();
}
```

Do not call `render()` in the submit catch, so typed values remain available for correction. Update existing tests that previously collected error dialogs to assert `role="alert"` instead; keep confirmation-dialog assertions unchanged.

- [ ] **Step 5: Run all affected E2E tests and confirm GREEN**

Run: `npx playwright test tests/e2e/notifications.spec.js tests/e2e/backup.spec.js tests/e2e/budget-roster.spec.js tests/e2e/catalogue.spec.js --project=chromium --reporter=line`

Expected: visible notification tests pass, no error alert dialogs occur, confirmations still work, and state remains recoverable.

- [ ] **Step 6: Commit outcome routing**

```bash
git add src/app.js tests/e2e/notifications.spec.js tests/e2e/backup.spec.js tests/e2e/budget-roster.spec.js tests/e2e/catalogue.spec.js
git commit -m "feat: surface application action feedback"
```

---

### Task 5: Add press feedback, notification styling, and reduced-motion behavior

**Files:**
- Modify: `src/ui-system.css:1,21-29`
- Modify: `DESIGN.md:7-28`
- Modify: `tests/e2e/accessibility-responsive.spec.js`
- Modify: `tests/e2e/notifications.spec.js`

**Interfaces:**
- Consumes: `.notification-region`, `.notification`, `[data-tone]`, and `.notification-dismiss` from Task 3.
- Produces: shared active-state feedback for `button` and `.button`, mobile toast geometry, and reduced-motion overrides.

- [ ] **Step 1: Add failing E2E assertions for press state, mobile geometry, tone, and reduced motion**

```js
test('shows tactile press feedback only when motion is allowed', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Crea asta Mantra' });
  const box = await button.boundingBox();
  if (!box) throw new Error('Setup button has no layout box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await button.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none');
  await page.mouse.up();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.down();
  expect(await button.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  await page.mouse.up();
});

test('keeps the notification inside a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
  await page.getByRole('button', { name: 'Strategia' }).click();
  await page.getByRole('button', { name: 'Salva configurazione' }).click();
  const box = await page.locator('.notification').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(12);
  expect(box.x + box.width).toBeLessThanOrEqual(378);
});
```

- [ ] **Step 2: Run the focused browser tests and confirm RED**

Run: `npx playwright test tests/e2e/notifications.spec.js tests/e2e/accessibility-responsive.spec.js --project=chromium --reporter=line`

Expected: FAIL because notification styles and tactile active transforms do not exist.

- [ ] **Step 3: Implement the shared CSS states using existing semantic tokens**

```css
:root{--info:#0b7285;--toast-z:40}
button,.button{transition:background-color .12s ease,transform .1s ease}
button:not(:disabled):active,.button:active{transform:translateY(1px) scale(.985)}
.notification-region{position:fixed;z-index:var(--toast-z);top:18px;right:18px;width:min(390px,calc(100vw - 24px));pointer-events:none}
.notification{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--ink);box-shadow:0 4px 8px rgba(8,66,59,.12);pointer-events:auto;animation:notification-in .16s ease-out}
.notification[data-tone="success"]{border-color:#9dcbb0;background:#e7f4ec;color:#124f2d}
.notification[data-tone="info"]{border-color:#98c9d1;background:#e8f5f7;color:#084f5c}
.notification[data-tone="error"]{border-color:#e6b3b3;background:#fdeaea;color:#852323}
.notification-dismiss{min-width:36px;min-height:36px;padding:4px;background:transparent;color:currentColor}
@keyframes notification-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media(max-width:620px){.notification-region{top:12px;right:12px;left:12px;width:auto}}
@media(prefers-reduced-motion:reduce){button:not(:disabled):active,.button:active{transform:none}.notification{animation:none}}
```

Keep shadow blur at 8 px, avoid layout animation, and verify success/error contrast. Update `DESIGN.md` with the notification semantic roles, stable placement, active press signature, and reduced-motion exception; runtime CSS remains the canonical token owner.

- [ ] **Step 4: Run responsive and accessibility tests**

Run: `npx playwright test tests/e2e/notifications.spec.js tests/e2e/accessibility-responsive.spec.js --project=chromium --reporter=line`

Expected: press, mobile bounds, keyboard dismissal, semantic role, and reduced-motion assertions pass.

- [ ] **Step 5: Commit visual feedback states**

```bash
git add src/ui-system.css DESIGN.md tests/e2e/notifications.spec.js tests/e2e/accessibility-responsive.spec.js
git commit -m "feat: add tactile and semantic feedback states"
```

---

### Task 6: Add the GitHub Pages deployment workflow and documentation

**Files:**
- Create: `.nojekyll`
- Create: `.github/workflows/pages.yml`
- Modify: `README.md:38-65`
- Modify: `README.md.ita:38-63`

**Interfaces:**
- Consumes: root-relative repository structure and fetch-based catalogue loader.
- Produces: a tested `_site` artifact and deployment to the configured `github-pages` environment.

- [ ] **Step 1: Add the empty `.nojekyll` marker**

Use `apply_patch` to add an empty root file named `.nojekyll`.

Expected: `.nojekyll` exists at repository root and is tracked as an empty file.

- [ ] **Step 2: Add the least-privilege test, package, and deploy workflow**

Create `.github/workflows/pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Stage static site
        run: |
          mkdir -p _site/src
          cp index.html .nojekyll _site/
          cp -R src/. _site/src/
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Document the GitHub Actions publishing flow in both README versions**

Add an English section to `README.md`:

```md
## Publish with GitHub Pages

The application is available at [mattia-vincenzi.github.io/AstaFanta](https://mattia-vincenzi.github.io/AstaFanta/).

In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The `Deploy to GitHub Pages` workflow runs the unit tests and deploys the static application after every push to `main`; it can also be started manually from the **Actions** tab. The project works under a repository subpath because all production resources are resolved relatively.
```

Add the equivalent Italian section to `README.md.ita`:

```md
## Pubblicazione con GitHub Pages

L’applicazione è consultabile su [mattia-vincenzi.github.io/AstaFanta](https://mattia-vincenzi.github.io/AstaFanta/).

In **Settings → Pages → Build and deployment**, seleziona **GitHub Actions** come sorgente. Il workflow `Deploy to GitHub Pages` esegue i test unitari e pubblica l'applicazione statica dopo ogni push su `main`; può anche essere avviato manualmente dalla scheda **Actions**. Il progetto funziona sotto il percorso del repository perché tutte le risorse di produzione sono risolte relativamente.
```

- [ ] **Step 4: Validate the workflow and the exact public artifact contents**

Run:

```bash
npx --yes --package @action-validator/cli action-validator .github/workflows/pages.yml
pages_stage_dir="$(mktemp -d)"
trap 'rm -rf "$pages_stage_dir"' EXIT
mkdir -p "$pages_stage_dir/src"
cp index.html .nojekyll "$pages_stage_dir/"
cp -R src/. "$pages_stage_dir/src/"
actual_files="$(cd "$pages_stage_dir" && find . -type f | sed 's#^\./##' | sort)"
expected_files="$(printf '%s\n' .nojekyll index.html; find src -type f | sort)"
test "$actual_files" = "$expected_files"
rg -n "(?:src|href)=\"/|new URL\('/" index.html src || true
```

Expected: the workflow is valid; the temporary staged tree contains exactly `.nojekyll`, `index.html`, and files below `src/`; no absolute asset/module URL matches.

- [ ] **Step 5: Commit the Pages pipeline and documentation**

```bash
git add .github/workflows/pages.yml .nojekyll README.md README.md.ita
git commit -m "ci: deploy static app to GitHub Pages"
```

---

### Task 7: Complete integration, regression, and Pages-equivalent verification

**Files:**
- Modify only if a verification failure requires a targeted fix: files introduced or changed in Tasks 1-6.

**Interfaces:**
- Consumes: all loader, bootstrap, notification, CSS, test, and documentation changes.
- Produces: a release-ready static tree and a workflow ready to deploy through the already configured GitHub Pages Actions source.

- [ ] **Step 1: Run static checks and all unit tests**

Run: `git diff --check && npm test`

Expected: no whitespace errors and all unit tests pass.

- [ ] **Step 2: Run the complete Playwright suite**

Run: `npm run test:e2e -- --reporter=line`

Expected: all E2E tests pass with zero unexpected `pageerror`, console error, or native error dialog.

- [ ] **Step 3: Verify the project-subpath URL contract directly**

Run:

```bash
node --input-type=module -e "console.log(new URL('./players.json','https://example.github.io/AstaFanta/src/app.js').pathname)"
```

Expected: `/AstaFanta/src/players.json`.

- [ ] **Step 4: Run focused browser QA at desktop, mobile, and reduced motion**

Check these states in Chromium:

1. Normal catalogue startup and setup screen.
2. Failed catalogue load, visible error, and successful retry.
3. Strategy save → `Configurazione salvata`.
4. Invalid backup → visible `Backup non valido`, no native alert.
5. Notification replacement and keyboard dismissal.
6. Press state on enabled buttons; no transform under reduced motion.
7. Notification fully within 390 × 844 viewport.

Expected: no clipping, layout shift, duplicate toast, focus loss, or inaccessible error state.

- [ ] **Step 5: Scan for compatibility and feedback regressions**

Run:

```bash
rg -n "with \{ type: 'json' \}|alert\(" src tests
rg -n "showNotification|data-tone|notification-region" src tests UX-CONTRACT.md DESIGN.md
```

Expected: no JSON import attributes and no error `alert()` calls; notification references appear only in the shared implementation, contract, styles, and tests.

- [ ] **Step 6: Request code review and commit any review fixes**

Use `superpowers:requesting-code-review`, address verified findings, rerun Steps 1-5, then commit only the targeted fixes:

```bash
git add src/app.js src/catalogues.js src/notifications.js src/ui-system.css tests/catalogues.test.js tests/notifications.test.js tests/e2e/catalogue-loading.spec.js tests/e2e/notifications.spec.js tests/e2e/backup.spec.js tests/e2e/budget-roster.spec.js tests/e2e/catalogue.spec.js tests/e2e/accessibility-responsive.spec.js UX-CONTRACT.md DESIGN.md README.md README.md.ita .nojekyll
git commit -m "fix: address Pages feedback review"
```
