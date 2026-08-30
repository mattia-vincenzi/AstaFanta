import { expect, test } from '@playwright/test';

test('starts after fetching both catalogues', async ({ page }) => {
  const catalogues = [];
  page.on('request', (request) => {
    if (request.url().endsWith('players.json') || request.url().endsWith('players-classic.json')) {
      catalogues.push(request.url());
    }
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
