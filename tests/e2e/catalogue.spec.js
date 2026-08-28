import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();
const dialogMode = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  dialogMode.set(page, 'dismiss');
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('dialog', (dialog) => dialogMode.get(page) === 'accept' ? dialog.accept() : dialog.dismiss());

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
});

test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]));

async function openCatalogueForm(page) {
  await page.getByRole('button', { name: 'Catalogo' }).click();
  await page.getByRole('button', { name: 'Aggiungi giocatore' }).click();
}

async function fillPlayer(page, player) {
  await page.getByLabel('ID univoco').fill(player.id);
  await page.getByLabel('Nome').fill(player.name);
  await page.getByLabel('Squadra').fill(player.team);
  await page.getByLabel('Ruoli').fill(player.roles);
  await page.getByLabel('Qt').fill(String(player.qt ?? 1));
  await page.getByLabel('FVM M').fill(String(player.fvm ?? 10));
}

test('inserisce un giocatore con campi etichettati e lo conserva al refresh', async ({ page }) => {
  await openCatalogueForm(page);
  await fillPlayer(page, { id: 'qa-1', name: 'Test', team: 'QA', roles: 'M' });
  await page.getByRole('button', { name: 'Salva giocatore' }).click();

  await expect(page.getByRole('cell', { name: 'qa-1', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Catalogo' }).click();
  await expect(page.getByRole('cell', { name: 'qa-1', exact: true })).toBeVisible();
});

test('rifiuta un ID duplicato senza sovrascrivere il giocatore esistente', async ({ page }) => {
  await openCatalogueForm(page);
  await fillPlayer(page, { id: 'qa-1', name: 'Originale', team: 'QA', roles: 'M' });
  await page.getByRole('button', { name: 'Salva giocatore' }).click();

  await page.getByRole('button', { name: 'Aggiungi giocatore' }).click();
  await fillPlayer(page, { id: 'qa-1', name: 'Sovrascritto', team: 'ALT', roles: 'C' });
  await page.getByRole('button', { name: 'Salva giocatore' }).click();

  await expect(page.getByRole('cell', { name: 'Originale', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Sovrascritto', exact: true })).toHaveCount(0);
});

test('modifica un giocatore ed elimina soltanto quelli liberi', async ({ page }) => {
  await openCatalogueForm(page);
  await fillPlayer(page, { id: 'qa-edit', name: 'Da modificare', team: 'QA', roles: 'M' });
  await page.getByRole('button', { name: 'Salva giocatore' }).click();

  const originalRow = page.getByRole('row').filter({ hasText: 'Da modificare' });
  await originalRow.getByRole('button', { name: 'Modifica' }).click();
  await page.getByLabel('Nome').fill('Modificato');
  await page.getByLabel('Ruoli').fill('C');
  await page.getByRole('button', { name: 'Salva giocatore' }).click();

  const editedRow = page.getByRole('row').filter({ hasText: 'Modificato' });
  await expect(editedRow).toContainText('C');
  dialogMode.set(page, 'accept');
  await editedRow.getByRole('button', { name: 'Elimina' }).click();
  await expect(page.getByRole('cell', { name: 'Modificato', exact: true })).toHaveCount(0);
});

test('non espone Elimina per un giocatore assegnato', async ({ page }) => {
  await openCatalogueForm(page);
  await fillPlayer(page, { id: 'qa-assigned', name: 'Assegnato QA', team: 'QA', roles: 'M' });
  await page.getByRole('button', { name: 'Salva giocatore' }).click();

  await page.getByRole('button', { name: 'Asta live' }).click();
  await page.getByRole('textbox', { name: 'Cerca giocatore' }).fill('Assegnato QA');
  await page.getByRole('row').filter({ hasText: 'Assegnato QA' }).click();
  await page.getByLabel('Prezzo').fill('1');
  await page.getByRole('button', { name: 'Conferma acquisto' }).click();
  await page.getByRole('button', { name: 'Catalogo' }).click();

  const assignedRow = page.getByRole('row').filter({ hasText: 'Assegnato QA' });
  await expect(assignedRow.getByRole('button', { name: 'Modifica' })).toBeVisible();
  await expect(assignedRow.getByRole('button', { name: 'Elimina' })).toHaveCount(0);
});
