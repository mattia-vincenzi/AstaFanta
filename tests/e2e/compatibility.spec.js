import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]));

test('protegge il layout dalle safe area dei dispositivi mobili', async ({ page }) => {
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).toContain('viewport-fit=cover');
});

test('mantiene campi leggibili senza zoom automatico e contiene overflow su mobile', async ({ page }) => {
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
  await page.getByRole('button', { name: 'Strategia' }).click();

  const fontSize = await page.locator('#strategy-form input[type="number"]').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  const tableWrap = page.locator('.strategy-panel .table-wrap');
  expect(await tableWrap.evaluate((element) => element.scrollWidth >= element.clientWidth)).toBe(true);
});

test('usa tipi di pulsante e validazione applicativa espliciti in ogni sezione', async ({ page }) => {
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();

  for (const section of ['Asta live', 'Squadre', 'Strategia', 'Catalogo']) {
    await page.getByRole('button', { name: section }).click();
    const implicitButtons = page.locator('button:not([type])');
    await expect(implicitButtons).toHaveCount(0);
    for (const form of await page.locator('form').all()) await expect(form).toHaveJSProperty('noValidate', true);
  }
});
