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
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
});

test.afterEach(async ({ page }) => expect(browserErrors.get(page)).toEqual([]));

async function expectSortableDataColumns(table, sortableColumns, staticColumns = 0) {
  const headers = table.getByRole('columnheader');
  await expect(headers).toHaveCount(sortableColumns + staticColumns);
  await expect(headers.getByRole('button')).toHaveCount(sortableColumns);
}

test('rende ordinabili tutte le colonne dati di ogni tabella', async ({ page }) => {
  const liveTables = page.getByRole('table');
  await expectSortableDataColumns(liveTables.nth(0), 4);
  await expectSortableDataColumns(liveTables.nth(1), 5);

  await page.getByRole('button', { name: 'Strategia' }).click();
  await expectSortableDataColumns(page.getByRole('table'), 5, 1);

  await page.getByRole('button', { name: 'Catalogo' }).click();
  await expectSortableDataColumns(page.getByRole('table'), 6, 1);
});

test('espone direzione accessibile e inverte realmente le righe', async ({ page }) => {
  const auctionTable = page.getByRole('table').nth(1);
  const nameHeader = auctionTable.getByRole('columnheader', { name: /Nome/ });
  const firstName = auctionTable.getByRole('row').nth(1).getByRole('cell').nth(0);
  const ascendingFirst = await firstName.innerText();

  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  await nameHeader.getByRole('button').press('Enter');
  await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(firstName).not.toHaveText(ascendingFirst);
});

test('ordina la strategia senza perdere valori non ancora salvati', async ({ page }) => {
  await page.getByRole('button', { name: 'Strategia' }).click();
  const strategyTable = page.getByRole('table');
  const editedSlots = strategyTable.locator('input[name="Por-slots"]');
  await editedSlots.fill('73');

  await strategyTable.getByRole('button', { name: 'Slot' }).click();

  await expect(strategyTable.locator('input[name="Por-slots"]')).toHaveValue('73');
  await expect(strategyTable.getByRole('columnheader', { name: /Slot/ })).toHaveAttribute('aria-sort', 'ascending');
});
