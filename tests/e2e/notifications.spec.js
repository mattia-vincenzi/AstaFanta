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

test('announces an exported backup as informational feedback', async ({ page }) => {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Esporta backup' }).click();
  await download;

  const notification = page.getByRole('status').filter({ hasText: 'Backup esportato' });
  await expect(notification).toHaveAttribute('data-tone', 'info');
});

test('announces an assignment once through the canonical live role', async ({ page }) => {
  const row = page.locator('[data-action="select-player"]').first();
  const playerName = await row.locator('td').first().innerText();
  await row.click();
  await page.getByLabel('Prezzo').fill('1');
  await page.getByRole('button', { name: 'Conferma acquisto' }).click();

  await expect(page.getByRole('status')).toContainText(`${playerName} assegnato per 1 crediti`);
  await expect(page.locator('.notification-region')).not.toHaveAttribute('aria-live');
  await expect(page.getByText(`${playerName} assegnato per 1 crediti`, { exact: false })).toHaveCount(1);
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

test('keeps the notification inside a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Strategia' }).click();
  await page.getByRole('button', { name: 'Salva configurazione' }).click();

  const notification = page.locator('.notification');
  const region = page.locator('.notification-region');
  await expect(region).toHaveCSS('position', 'fixed');
  const box = await notification.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(12);
  expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(378);
});
