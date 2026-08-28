export const filterPlayers = (players, assignedIds, filters) => players.filter((player) => {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery = !query || `${player.name} ${player.team}`.toLowerCase().includes(query);
  const matchesRole = !filters.role || player.roles.includes(filters.role);
  const matchesAvailability = filters.availability !== 'free' || !assignedIds.has(player.id);
  return matchesQuery && matchesRole && matchesAvailability;
});

export const selectedPlayerLabel = (player) => `${player.name} · ${player.team} (${player.roles.join('/')})`;

export const suggestedBudgetRole = (roles) => roles[0] || '';

export const sortRows = (rows, key, direction = 'asc') => [...rows].sort((left, right) => {
  const a = left[key];
  const b = right[key];
  const comparison = typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a ?? '').localeCompare(String(b ?? ''), 'it', { numeric: true });
  return direction === 'desc' ? -comparison : comparison;
});
