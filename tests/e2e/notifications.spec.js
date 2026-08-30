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
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.type());
    await dialog.dismiss();
  });

  await page.locator('input[data-action="import"]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"invalid":true}'),
  });

  await expect(page.getByRole('alert')).toContainText('Backup non valido');
  expect(dialogs).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Asta Mantra' })).toBeVisible();
});
