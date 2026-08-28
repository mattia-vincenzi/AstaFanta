import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('dialog', (dialog) => dialog.dismiss());
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
});

test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]));

test('annuncia il limite del catalogo e lo stato della riga selezionata', async ({ page }) => {
  await expect(page.getByText(/120 di \d+ disponibili/)).toBeVisible();
  const row = page.locator('[data-action="select-player"]').first();
  await expect(row).toHaveAttribute('aria-selected', 'false');
  await row.click();
  await expect(page.locator('[data-action="select-player"]').filter({ has: page.locator('[aria-selected="true"]') })).toHaveCount(0);
  await expect(page.locator('[data-action="select-player"][aria-selected="true"]')).toHaveCount(1);
});

test('azzera la ricerca e restituisce il focus al campo', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Cerca giocatore' });
  await search.fill('nessun-risultato');
  await page.getByRole('button', { name: 'Azzera ricerca' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
});

test('mantiene target touch di almeno 44 pixel a 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Catalogo' }).click();
  const controls = [
    page.getByRole('button', { name: 'Aggiungi giocatore' }),
    page.getByRole('button', { name: 'Modifica' }).first(),
    page.getByRole('button', { name: 'Elimina' }).first(),
  ];
  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
