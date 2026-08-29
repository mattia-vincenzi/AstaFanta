import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const OUTPUT_DIR = path.resolve('example-config');
const CLASSIC_OUTPUT = path.join(OUTPUT_DIR, 'asta-classic-completa.json');
const MANTRA_OUTPUT = path.join(OUTPUT_DIR, 'asta-mantra-completa.json');

test.describe.configure({ mode: 'serial', timeout: 600_000 });

function seededAllocation(total, keys, seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  const weights = keys.map(() => 1 + random() * 4);
  const allocation = weights.map((weight) => Math.floor((weight / weights.reduce((sum, item) => sum + item, 0)) * total));
  allocation[allocation.length - 1] += total - allocation.reduce((sum, item) => sum + item, 0);
  return Object.fromEntries(keys.map((key, index) => [key, allocation[index]]));
}

async function startAuction(page, setup) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  if (setup === 'classic') await page.getByLabel('Classic').check();
  await page.getByRole('button', { name: `Crea asta ${setup === 'classic' ? 'Classic' : 'Mantra'}` }).click();
}

async function renameAllTeams(page, names) {
  await page.getByRole('button', { name: 'Squadre' }).click();
  for (let index = 0; index < names.length; index += 1) {
    const card = page.locator('.team-card').nth(index);
    await card.getByLabel('Nome squadra').fill(names[index]);
    await card.getByRole('button', { name: 'Salva' }).click();
  }
  for (const name of names) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}

async function configureStrategy(page, setup, roles, budget, rosterSize) {
  const targetBudgets = seededAllocation(budget, roles, setup === 'classic' ? 20260829 : 20260830);
  const slotBudgets = setup === 'mantra' ? seededAllocation(rosterSize, roles, 20260831) : {};
  await page.getByRole('button', { name: 'Strategia' }).click();
  for (const role of roles.slice(0, 4)) {
    await page.locator(`[data-action="add-target-band"][data-role="${role}"]`).click();
  }
  for (const role of roles) {
    if (setup === 'mantra') await page.locator(`[name="${role}-slots"]`).fill(String(slotBudgets[role]));
    const target = targetBudgets[role];
    await page.locator(`[name="${role}-min"]`).fill(String(Math.max(0, target - Math.ceil(target * 0.2))));
    await page.locator(`[name="${role}-target"]`).fill(String(target));
    await page.locator(`[name="${role}-max"]`).fill(String(target + Math.ceil(target * 0.2)));
  }
  for (const role of roles.slice(0, 4)) {
    await page.locator(`[name="target-${role}-0-label"]`).fill('Osservati asta');
    await page.locator(`[name="target-${role}-0-min"]`).fill('1');
    await page.locator(`[name="target-${role}-0-max"]`).fill('25');
    await page.locator(`[name="target-${role}-0-players"]`).fill(`Target ${role} principale\nAlternativa ${role}\nAppunto: rilanciare con prudenza`);
  }
  await page.getByRole('button', { name: 'Salva configurazione' }).click();
  return { targetBudgets, slotBudgets };
}

async function setMantraRosterSizes(page, sizes) {
  await page.getByRole('button', { name: 'Strategia' }).click();
  for (let index = 0; index < sizes.length; index += 1) {
    await page.getByLabel('La mia squadra').selectOption(`team-${index + 1}`);
    await page.getByLabel('Dimensione rosa').fill(String(sizes[index]));
    await page.getByRole('button', { name: 'Salva configurazione' }).click();
  }
}

async function assignFirstAvailable(page, teamId, role = '') {
  await page.getByRole('button', { name: 'Asta live' }).click();
  if (role) await page.getByLabel('Filtra ruolo').selectOption(role);
  else await page.getByLabel('Filtra ruolo').selectOption('');
  const row = page.locator('[data-action="select-player"]').first();
  await expect(row).toBeVisible();
  await row.click();
  await page.getByLabel('Squadra').selectOption(teamId);
  await page.getByLabel('Prezzo').fill('1');
  await page.getByRole('button', { name: 'Conferma acquisto' }).click();
}

async function exerciseRemoval(page, teamName) {
  await page.getByRole('button', { name: 'Squadre' }).click();
  const card = page.locator('.team-card').filter({ has: page.getByRole('heading', { name: teamName, exact: true }) });
  await card.getByText('Apri rosa').click();
  await card.getByRole('button', { name: /^Rimuovi / }).first().click();
}

async function exportAndReimport(page, outputPath, setup, expectedNames, expectedSizes) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Esporta backup' }).click();
  const download = await downloadPromise;
  await download.saveAs(outputPath);

  const exported = JSON.parse(await fs.readFile(outputPath, 'utf8'));
  expect(exported.version).toBe(1);
  expect(exported.state.setup).toBe(setup);
  expect(exported.state.teams.map((team) => team.name)).toEqual(expectedNames);
  expect(exported.state.teams.map((team) => team.rosterSize)).toEqual(expectedSizes);
  expect(exported.state.assignments).toHaveLength(expectedSizes.reduce((sum, size) => sum + size, 0));
  expect(new Set(exported.state.assignments.map((assignment) => assignment.playerId)).size).toBe(exported.state.assignments.length);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Crea asta Mantra' }).click();
  await page.locator('input[data-action="import"]').setInputFiles(outputPath);
  await expect(page.getByRole('heading', { name: `Asta ${setup === 'classic' ? 'Classic' : 'Mantra'}` })).toBeVisible();
  await page.getByRole('button', { name: 'Squadre' }).click();
  for (let index = 0; index < expectedNames.length; index += 1) {
    const card = page.locator('.team-card').nth(index);
    await expect(card.getByRole('heading', { name: expectedNames[index], exact: true })).toBeVisible();
    await expect(card.getByText(`${expectedSizes[index]}/${expectedSizes[index]} giocatori`, { exact: true })).toBeVisible();
  }
  return exported;
}

test('completa, esporta e reimporta tutte le rose Classic', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const names = ['Classic Aquile', 'Classic Lupi', 'Classic Tori', 'Classic Leoni', 'Classic Falchi', 'Classic Vespe', 'Classic Draghi', 'Classic Delfini'];
  const roles = ['P', 'D', 'C', 'A'];
  const slots = { P: 3, D: 8, C: 8, A: 6 };

  await startAuction(page, 'classic');
  await renameAllTeams(page, names);
  const strategy = await configureStrategy(page, 'classic', roles, 500, 25);
  expect(Object.values(strategy.targetBudgets).reduce((sum, value) => sum + value, 0)).toBe(500);

  for (let team = 1; team <= names.length; team += 1) {
    await assignFirstAvailable(page, `team-${team}`, 'P');
    await exerciseRemoval(page, names[team - 1]);
  }
  for (const role of roles) {
    for (let team = 1; team <= names.length; team += 1) {
      for (let count = 0; count < slots[role]; count += 1) await assignFirstAvailable(page, `team-${team}`, role);
    }
  }

  const exported = await exportAndReimport(page, CLASSIC_OUTPUT, 'classic', names, names.map(() => 25));
  expect(exported.state.strategy.roleTargets.P[0].players).toContain('Appunto: rilanciare con prudenza');
  expect(errors).toEqual([]);
});

test('completa, esporta e reimporta rose Mantra variabili da 26 a 30 giocatori', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const names = ['Mantra Nord', 'Mantra Sud', 'Mantra Est', 'Mantra Ovest', 'Mantra Centro', 'Mantra Alfa', 'Mantra Beta', 'Mantra Gamma', 'Mantra Delta', 'Mantra Omega'];
  const sizes = [26, 27, 28, 29, 30, 26, 28, 30, 27, 29];
  const roles = ['Por', 'Dd', 'Ds', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];

  await startAuction(page, 'mantra');
  await renameAllTeams(page, names);
  await setMantraRosterSizes(page, sizes);
  const strategy = await configureStrategy(page, 'mantra', roles, 1000, sizes.at(-1));
  expect(Object.values(strategy.targetBudgets).reduce((sum, value) => sum + value, 0)).toBe(1000);
  expect(Object.values(strategy.slotBudgets).reduce((sum, value) => sum + value, 0)).toBe(sizes.at(-1));

  for (let team = 1; team <= names.length; team += 1) {
    await assignFirstAvailable(page, `team-${team}`);
    await exerciseRemoval(page, names[team - 1]);
  }
  for (let team = 1; team <= names.length; team += 1) {
    for (let count = 0; count < sizes[team - 1]; count += 1) await assignFirstAvailable(page, `team-${team}`);
  }

  const exported = await exportAndReimport(page, MANTRA_OUTPUT, 'mantra', names, sizes);
  expect(exported.state.strategy.roleTargets.Por[0].players).toContain('Appunto: rilanciare con prudenza');
  expect(errors).toEqual([]);
});
