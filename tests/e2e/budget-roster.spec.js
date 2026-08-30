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

async function addPlayer(page, id, name, role) {
  await page.getByRole('button', { name: 'Catalogo' }).click();
  await page.getByRole('button', { name: 'Aggiungi giocatore' }).click();
  await page.getByLabel('ID univoco').fill(id);
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('Squadra').fill('QA');
  await page.getByLabel('Ruoli').fill(role);
  await page.getByLabel('Qt').fill('1');
  await page.getByLabel('FVM M').fill('10');
  await page.getByRole('button', { name: 'Salva giocatore' }).click();
}

async function assignPlayer(page, name, price) {
  await page.getByRole('button', { name: 'Asta live' }).click();
  await page.getByRole('textbox', { name: 'Cerca giocatore' }).fill(name);
  await page.getByRole('row').filter({ hasText: name }).click();
  await page.getByLabel('Prezzo').fill(String(price));
  await page.getByRole('button', { name: 'Conferma acquisto' }).click();
}

test('non registra un secondo giocatore quando la rosa Mantra è piena', async ({ page }) => {
  await addPlayer(page, 'qa-m', 'Primo QA', 'M');
  await addPlayer(page, 'qa-c', 'Secondo QA', 'C');
  await page.getByRole('button', { name: 'Strategia' }).click();
  await page.getByLabel('Dimensione rosa').fill('1');
  await page.getByRole('button', { name: 'Salva configurazione' }).click();

  await assignPlayer(page, 'Primo QA', 10);
  await assignPlayer(page, 'Secondo QA', 5);

  await expect(page.getByRole('alert')).toContainText('Rosa piena');
  await page.getByRole('button', { name: 'Squadre' }).click();
  await expect(page.getByText('1/1', { exact: true }).first()).toBeVisible();
});

test('non salva un budget inferiore ai crediti già spesi', async ({ page }) => {
  await addPlayer(page, 'qa-budget', 'Budget QA', 'M');
  await assignPlayer(page, 'Budget QA', 30);
  await page.getByRole('button', { name: 'Strategia' }).click();
  const budget = page.getByLabel('Budget iniziale');
  await budget.fill('1');
  await budget.press('Enter');

  await expect(page.getByRole('alert')).toContainText('Il budget non può essere inferiore ai crediti già spesi');
  await expect(budget).toHaveValue('1');
  await expect(budget).toBeFocused();
});
