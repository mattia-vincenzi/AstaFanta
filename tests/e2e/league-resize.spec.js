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
  await page.getByLabel('Numero squadre').fill('3');
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
});

test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]));

test('riallinea la squadra propria dopo una riduzione valida', async ({ page }) => {
  await page.getByRole('button', { name: 'Strategia' }).click();
  await page.getByLabel('La mia squadra').selectOption('team-3');
  await page.getByRole('button', { name: 'Squadre' }).click();
  await page.getByLabel('Numero squadre').fill('2');
  await page.getByRole('button', { name: 'Applica' }).click();

  await page.getByRole('button', { name: 'Strategia' }).click();
  await expect(page.getByLabel('La mia squadra')).toHaveValue('team-1');
});

test('rifiuta atomicamente la rimozione di una squadra con acquisti', async ({ page }) => {
  await page.locator('[data-action="select-player"]').first().click();
  await page.getByLabel('Squadra').selectOption('team-3');
  await page.getByLabel('Prezzo').fill('10');
  await page.getByRole('button', { name: 'Conferma acquisto' }).click();
  await page.getByRole('button', { name: 'Squadre' }).click();
  await page.getByLabel('Numero squadre').fill('2');
  await page.getByRole('button', { name: 'Applica' }).click();

  await expect(page.getByRole('alert')).toContainText('Non puoi rimuovere squadre con acquisti');
  expect(dialogs.get(page)).toEqual([]);
  await expect(page.getByLabel('Numero squadre')).toHaveValue('2');
  await expect(page.getByRole('heading', { name: 'Squadra 3' })).toBeVisible();
});
