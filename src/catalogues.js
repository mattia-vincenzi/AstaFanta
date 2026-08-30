export async function loadCatalogue(url, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Catalogo non disponibile (${response.status})`);
  const players = await response.json();
  if (!Array.isArray(players)) throw new Error('Formato catalogo non valido');
  return players;
}

export async function loadCatalogues(fetchImpl = fetch, moduleUrl = import.meta.url) {
  const [mantraPlayers, classicPlayers] = await Promise.all([
    loadCatalogue(new URL('./players.json', moduleUrl), fetchImpl),
    loadCatalogue(new URL('./players-classic.json', moduleUrl), fetchImpl),
  ]);
  return { mantraPlayers, classicPlayers };
}
