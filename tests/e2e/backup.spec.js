import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();
const dialogs = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  const messages = [];
  browserErrors.set(page, errors);
  dialogs.set(page, messages);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('dialog', async (dialog) => {
    messages.push(dialog.message());
    await dialog.dismiss();
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
});

test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]));

test('esporta e reimporta uno stato valido senza perdere la modalità', async ({ page }) => {
  await page.getByRole('button', { name: 'Squadre' }).click();
  const ownTeam = page.getByRole('article').filter({ hasText: 'La mia squadra' });
  await ownTeam.getByLabel('Nome squadra').fill('Backup QA');
  await ownTeam.getByRole('button', { name: 'Salva' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Esporta backup' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
  await page.locator('input[data-action="import"]').setInputFiles(backupPath);

  await expect(page.getByRole('heading', { name: 'Asta Mantra' })).toBeVisible();
  await expect(page.getByText('Backup QA · 1000 crediti · 28 slot')).toBeVisible();
});

test('rifiuta uno schema invalido e mantiene lo stato corrente', async ({ page }) => {
  await page.locator('input[data-action="import"]').setInputFiles({
    name: 'invalid-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, state: {} })),
  });

  await expect.poll(() => dialogs.get(page)).toContain('Backup non valido');
  await expect(page.getByRole('heading', { name: 'Asta Mantra' })).toBeVisible();
  await expect(page.getByText('La mia squadra · 1000 crediti · 28 slot')).toBeVisible();
});
