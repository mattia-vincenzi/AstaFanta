export const filterPlayers = (players, assignedIds, filters) => players.filter((player) => {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery = !query || `${player.name} ${player.team}`.toLowerCase().includes(query);
  const matchesRole = !filters.role || player.roles.includes(filters.role);
  const matchesAvailability = filters.availability !== 'free' || !assignedIds.has(player.id);
  return matchesQuery && matchesRole && matchesAvailability;
});
