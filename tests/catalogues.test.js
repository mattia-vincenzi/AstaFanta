import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCatalogues } from '../src/catalogues.js';

test('loads both catalogues relative to the app module under a project subpath', async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(String(url));
    return { ok: true, json: async () => [{ id: String(requested.length) }] };
  };

  const result = await loadCatalogues(fetchImpl, 'https://example.github.io/AstaFanta/src/app.js');

  assert.deepEqual(requested, [
    'https://example.github.io/AstaFanta/src/players.json',
    'https://example.github.io/AstaFanta/src/players-classic.json',
  ]);
  assert.equal(result.mantraPlayers.length, 1);
  assert.equal(result.classicPlayers.length, 1);
});

test('rejects an unsuccessful catalogue response', async () => {
  await assert.rejects(
    loadCatalogues(async () => ({ ok: false, status: 404 }), 'https://example.test/src/app.js'),
    /Catalogo non disponibile \(404\)/,
  );
});

test('rejects a catalogue whose JSON root is not an array', async () => {
  await assert.rejects(
    loadCatalogues(async () => ({ ok: true, json: async () => ({ players: [] }) }), 'https://example.test/src/app.js'),
    /Formato catalogo non valido/,
  );
});
