import mantraPlayers from './players.json' with { type: 'json' };
import classicPlayers from './players-classic.json' with { type: 'json' };
import { assignPlayer, createSetup, opponentSummaries, ownRoleSummaries, renameTeam, resizeLeague, roleSummaries, setupRules, strategyWarnings, teamSummary, validatePlayer } from './domain.js';
import { exportState, importState, loadState, saveState } from './storage.js';
import { assignableRoles, catalogueColumns, catalogueForSetup, filterPlayers, groupRosterByRole, roleCardModel, selectedPlayerLabel, sortRows } from './render.js';

const root = document.querySelector('#app');
let state = loadState(localStorage, null);
if (state) {
  const compatiblePlayers = catalogueForSetup(state.setup, state.players, classicPlayers);
  if (compatiblePlayers !== state.players) {
    state = { ...state, players: compatiblePlayers };
    saveState(localStorage, state);
  }
}
let tab = 'asta';
let filters = { query: '', role: '', availability: 'free' };
let selectedPlayerId = '';
let selectedTeamId = '';
let tableSort = { opponents: { key: 'remaining', direction: 'desc' }, catalogue: { key: 'name', direction: 'asc' } };
let feedback = '';

const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const persist = () => saveState(localStorage, state);
const ownTeam = () => state.teams.find((team) => team.id === state.ownTeamId) || state.teams[0];
const assignedIds = () => new Set(state.assignments.map((entry) => entry.playerId));
const playerFor = (id) => state.players.find((player) => player.id === id);
const rules = () => setupRules(state.setup);
const sortable = (table, key, label) => `<button class="sort" data-sort-table="${table}" data-sort-key="${key}">${label}${tableSort[table]?.key === key ? (tableSort[table].direction === 'asc' ? ' ▲' : ' ▼') : ''}</button>`;
const roleBadge = (role) => `<span class="role-badge role-${role.toLowerCase()}">${role}</span>`;

function header() {
  const summary = teamSummary(state, state.ownTeamId);
  return `<header class="app-header"><div><p class="mode-label">Modalità ${rules().label}</p><h1>Asta ${rules().label}</h1><p>${escape(ownTeam().name)} · ${summary.remaining} crediti · ${summary.slotsRemaining} slot</p></div><p class="sr-only" aria-live="polite">${escape(feedback)}</p><div class="backup"><button data-action="export">Esporta backup</button><label class="button">Importa backup<input data-action="import" type="file" accept="application/json" hidden></label><button data-action="reset" class="quiet">Nuova asta</button></div></header>`;
}

function navigation() {
  return `<nav aria-label="Sezioni principali">${[['asta', 'Asta live'], ['squadre', 'Squadre'], ['strategia', 'Strategia'], ['catalogo', 'Catalogo']].map(([id, label]) => `<button class="${tab === id ? 'active' : ''}" data-tab="${id}" aria-current="${tab === id ? 'page' : 'false'}">${label}</button>`).join('')}</nav>`;
}

function setupScreen() {
  return `<main class="setup-screen"><section class="panel setup-panel"><p class="mode-label">Tool asta locale</p><h1>Scegli il tuo regolamento</h1><p class="muted">Configura la lega prima di iniziare. Per cambiare modalità dovrai creare una nuova asta.</p><form id="setup-form"><fieldset class="setup-options"><legend>Modalità</legend><label class="setup-option"><input type="radio" name="setup" value="mantra" checked><span><b>Mantra</b><small>10 squadre · 1000 crediti · rosa 28</small></span></label><label class="setup-option"><input type="radio" name="setup" value="classic"><span><b>Classic</b><small>8 squadre · 500 crediti · 3P / 8D / 8C / 6A</small></span></label></fieldset><div class="setup-fields"><label>Numero squadre<input name="teamCount" type="number" min="2" value="10" required></label><label>Crediti per squadra<input name="budget" type="number" min="1" value="1000" required></label><label>Nome della mia squadra<input name="ownTeamName" value="La mia squadra" required></label></div><button>Crea asta Mantra</button></form></section></main>`;
}

function dashboard() {
  const mine = teamSummary(state, state.ownTeamId);
  const roleCards = ownRoleSummaries(state).map((summary) => roleCardModel(state.setup, summary));
  const opponents = sortRows(opponentSummaries(state), tableSort.opponents.key, tableSort.opponents.direction);
  return `<section class="command-center ${state.setup}"><div class="hero-kpi"><span>Crediti disponibili</span><strong>${mine.remaining}</strong><small>${mine.spent} spesi · ${mine.slotsRemaining} slot liberi</small></div><div class="role-overview"><h2>${state.setup === 'classic' ? 'La mia rosa per reparto' : 'La mia spesa per ruolo'}</h2><div class="role-cards">${roleCards.map((item) => `<article class="role-card ${item.complete ? 'complete' : ''}">${roleBadge(item.role)}<strong>${item.value}</strong><div class="meter" aria-label="${item.progress}%"><i style="width:${item.progress}%"></i></div><span>${item.detail}</span>${item.supporting ? `<small>${item.supporting}</small>` : ''}</article>`).join('')}</div></div><div class="opponents"><h2>Altre squadre</h2><div class="table-wrap compact"><table><thead><tr><th>${sortable('opponents', 'name', 'Squadra')}</th><th>${sortable('opponents', 'remaining', 'Residuo')}</th><th>${sortable('opponents', 'spent', 'Spesi')}</th><th>${sortable('opponents', 'players', 'Rosa')}</th>${state.setup === 'classic' ? '<th>Reparti</th>' : ''}</tr></thead><tbody>${opponents.map((team) => `<tr><td>${escape(team.name)}</td><td><b>${team.remaining}</b></td><td>${team.spent}</td><td>${team.players}/${team.rosterSize}</td>${state.setup === 'classic' ? `<td class="role-counts">${roleSummaries(state, team.id).map((item) => `<span class="${item.complete ? 'complete' : ''}">${item.role} ${item.players}/${item.slots}</span>`).join('')}</td>` : ''}</tr>`).join('')}</tbody></table></div></div></section>`;
}

function auction() {
  const columns = catalogueColumns(state.setup);
  const available = filterPlayers(state.players, assignedIds(), filters, state.setup);
  const visible = sortRows(available, 'name').slice(0, 120);
  const selected = playerFor(selectedPlayerId);
  const teamId = selectedTeamId || state.teams[0]?.id;
  const compatibleRoles = selected ? assignableRoles(state, selected, teamId) : [];
  const quotaBlocked = selected && state.setup === 'classic' && compatibleRoles.length === 0;
  return `${dashboard()}<section class="grid auction-grid"><article class="panel sale-panel"><div class="section-title"><span class="step-mark">1</span><div><h2>Registra acquisto</h2><p class="muted">Seleziona un giocatore dal catalogo, poi completa la cessione.</p></div></div><form id="sale-form"><input name="playerId" type="hidden" value="${escape(selectedPlayerId)}"><label>Giocatore selezionato<input value="${escape(selected ? selectedPlayerLabel(selected) : 'Nessun giocatore selezionato')}" readonly></label><label>Squadra<select name="teamId">${state.teams.map((team) => `<option value="${team.id}" ${team.id === teamId ? 'selected' : ''}>${escape(team.name)}</option>`).join('')}</select></label><label>Prezzo<input name="price" type="number" min="1" required></label><label>Ruolo${compatibleRoles.length === 1 ? `<input name="budgetRole" value="${compatibleRoles[0]}" readonly>` : `<select name="budgetRole">${compatibleRoles.map((role) => `<option>${role}</option>`).join('')}</select>`}</label>${quotaBlocked ? '<p class="inline-error" role="alert">Questa squadra ha già completato il reparto del giocatore.</p>' : ''}<button ${selected && !quotaBlocked ? '' : 'disabled'}>Conferma acquisto</button></form>${state.assignments.length ? '<button class="quiet undo" data-action="undo">Annulla ultimo acquisto</button>' : ''}</article><article class="panel catalogue-panel"><div class="section-title"><span class="step-mark">2</span><div><h2>Catalogo libero</h2><p class="muted">${available.length} disponibili · clicca una riga per selezionare</p></div></div><div class="filters"><input data-filter="query" aria-label="Cerca giocatore" placeholder="Cerca nome o squadra" value="${escape(filters.query)}" autocomplete="off"><select data-filter="role" aria-label="Filtra ruolo"><option value="">Tutti i ruoli</option>${rules().roles.map((role) => `<option ${filters.role === role ? 'selected' : ''}>${role}</option>`).join('')}</select></div><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Squadra</th><th>${columns.role}</th><th>Qt</th><th>${columns.fvm}</th></tr></thead><tbody>${visible.map((player) => `<tr class="selectable ${player.id === selectedPlayerId ? 'selected' : ''}" data-action="select-player" data-id="${player.id}" tabindex="0"><td><b>${escape(player.name)}</b></td><td>${escape(player.team)}</td><td>${player.roles.map(roleBadge).join('')}</td><td>${player.qt}</td><td>${player.fvm}</td></tr>`).join('')}</tbody></table></div></article></section>`;
}

function rosterDetails(team) {
  const assignments = state.assignments.filter((assignment) => assignment.teamId === team.id);
  if (!assignments.length) return '<p class="empty-state">Nessun acquisto. I giocatori assegnati appariranno qui.</p>';
  return `<div class="roster-groups">${groupRosterByRole(assignments, state.players, rules().roles).map((group) => `<section class="roster-group"><h4>${roleBadge(group.role)} <span>${group.players.length}${state.setup === 'classic' ? `/${state.classicSlots[group.role]}` : ''}</span></h4>${group.players.map((player) => `<div class="roster-player"><span><b>${escape(player.name)}</b><small>${escape(player.team || '')}</small></span><span><b>${player.price}</b> cr <button data-action="remove" data-id="${player.playerId}" class="remove-player" aria-label="Rimuovi ${escape(player.name)}">Rimuovi</button></span></div>`).join('') || '<p class="muted roster-empty">Nessun giocatore</p>'}</section>`).join('')}</div>`;
}

function teams() {
  return `<section class="panel teams-panel"><div class="section-heading"><div><p class="mode-label">Lega ${rules().label}</p><h2>Squadre</h2><p class="muted">Controlla crediti, composizione e rose. La Strategia resta legata solo alla tua squadra.</p></div><form id="league-size-form" class="league-size-form"><label>Numero squadre<input name="teamCount" type="number" min="2" value="${state.teams.length}"></label><button>Applica</button></form></div><div class="cards team-grid">${state.teams.map((team) => { const summary = teamSummary(state, team.id); const spentPct = team.budget ? Math.min(100, Math.round((summary.spent / team.budget) * 100)) : 0; const statuses = state.setup === 'classic' ? roleSummaries(state, team.id) : []; return `<article class="card team-card ${team.id === state.ownTeamId ? 'mine' : ''}"><div class="team-card-head"><div>${team.id === state.ownTeamId ? '<span class="mine-label">La mia squadra</span>' : ''}<h3>${escape(team.name)}</h3></div><strong>${summary.remaining}<small> crediti</small></strong></div><div class="meter"><i style="width:${spentPct}%"></i></div><div class="team-stats"><span><b>${summary.spent}</b> spesi</span><span><b>${summary.players}/${team.rosterSize}</b> giocatori</span></div>${statuses.length ? `<div class="team-roles">${statuses.map((item) => `<span class="${item.complete ? 'complete' : ''}">${roleBadge(item.role)} <b>${item.players}/${item.slots}</b></span>`).join('')}</div>` : ''}<form class="team-name-form"><input name="teamId" type="hidden" value="${team.id}"><label>Nome squadra<input name="teamName" value="${escape(team.name)}" required></label><button>Salva</button></form><details><summary>Apri rosa <span>${summary.players} giocatori</span></summary>${rosterDetails(team)}</details></article>`; }).join('')}</div></section>`;
}

function strategy() {
  const summary = teamSummary(state, state.ownTeamId);
  if (state.setup === 'classic') return `<section class="panel strategy-panel"><div class="section-heading"><div><p class="mode-label">Solo la mia squadra</p><h2>Strategia Classic</h2><p class="muted">Le quote della rosa sono fisse. Qui controlli budget e avanzamento dei reparti.</p></div><div class="strategy-total"><b>${summary.remaining}</b><span>crediti rimasti</span></div></div><form id="strategy-form" class="classic-strategy"><div class="strategy-top"><label>La mia squadra<select name="ownTeamId">${state.teams.map((team) => `<option value="${team.id}" ${team.id === state.ownTeamId ? 'selected' : ''}>${escape(team.name)}</option>`).join('')}</select></label><label>Nome squadra<input name="teamName" value="${escape(ownTeam().name)}"></label><label>Budget della mia squadra<input name="budget" type="number" min="1" value="${ownTeam().budget}"></label><label>Dimensione rosa<input value="25 giocatori" readonly></label></div><button>Salva configurazione</button></form><div class="strategy-roles">${roleSummaries(state, state.ownTeamId).map((item) => `<article class="strategy-role ${item.complete ? 'complete' : ''}">${roleBadge(item.role)}<strong>${item.players}/${item.slots}</strong><span>${item.spent} crediti spesi</span><small>${item.complete ? 'Reparto completo' : `${item.slotsRemaining} slot liberi`}</small></article>`).join('')}</div></section>`;
  const budgets = state.strategy?.roleBudgets || {}; const warnings = strategyWarnings(state);
  return `<section class="panel strategy-panel"><div><p class="mode-label">Solo la mia squadra</p><h2>Strategia Mantra</h2><p class="muted">Imposta obiettivi per ruolo. Gli avvisi non bloccano l'asta.</p></div><form id="strategy-form"><div class="strategy-top"><label>La mia squadra<select name="ownTeamId">${state.teams.map((team) => `<option value="${team.id}" ${team.id === state.ownTeamId ? 'selected' : ''}>${escape(team.name)}</option>`).join('')}</select></label><label>Nome squadra<input name="teamName" value="${escape(ownTeam().name)}"></label><label>Budget iniziale<input name="budget" type="number" min="1" value="${ownTeam().budget}"></label><label>Dimensione rosa<input name="rosterSize" type="number" min="1" value="${ownTeam().rosterSize}"></label></div><h3>Budget per ruolo</h3><div class="table-wrap"><table><thead><tr><th>Ruolo</th><th>Slot</th><th>Minimo</th><th>Obiettivo</th><th>Massimo</th></tr></thead><tbody>${Object.entries(budgets).map(([role, value]) => `<tr><td>${roleBadge(role)}</td>${['slots', 'min', 'target', 'max'].map((field) => `<td><input name="${role}-${field}" type="number" min="0" value="${value[field]}"></td>`).join('')}</tr>`).join('')}</tbody></table></div><button>Salva configurazione</button></form>${warnings.length ? `<div class="warnings" role="alert">${warnings.map((warning) => `${warning.role} supera il massimo (${warning.spent}/${warning.limit}).`).join('<br>')}</div>` : ''}<div class="strategy-summary">Spesi <b>${summary.spent}</b> · Residuo <b>${summary.remaining}</b> · Slot liberi <b>${summary.slotsRemaining}</b></div></section>`;
}

function catalogue() {
  const sorted = sortRows(state.players, tableSort.catalogue.key, tableSort.catalogue.direction);
  const columns = catalogueColumns(state.setup);
  return `<section class="panel"><div class="section-heading"><div><p class="mode-label">Catalogo ${rules().label}</p><h2>Listone modificabile</h2><p class="muted">Aggiungi o correggi giocatori. Gli assegnati non possono essere eliminati.</p></div><button data-action="new-player">Aggiungi giocatore</button></div><form id="player-form" class="player-form" hidden><input name="id" placeholder="ID univoco" required><input name="name" placeholder="Nome" required><input name="team" placeholder="Squadra" required><input name="roles" placeholder="${state.setup === 'classic' ? 'Ruolo: P, D, C o A' : 'Ruoli, es. M/C'}" required><input name="qt" type="number" placeholder="Qt" value="0"><input name="fvm" type="number" placeholder="${columns.fvm}" value="0"><button>Salva giocatore</button></form><div class="table-wrap"><table><thead><tr><th>${sortable('catalogue', 'id', 'ID')}</th><th>${sortable('catalogue', 'name', 'Nome')}</th><th>${sortable('catalogue', 'team', 'Squadra')}</th><th>${sortable('catalogue', 'roles', columns.role)}</th><th>${sortable('catalogue', 'qt', 'Qt')}</th><th>${sortable('catalogue', 'fvm', columns.fvm)}</th><th>Azioni</th></tr></thead><tbody>${sorted.map((player) => `<tr><td>${player.id}</td><td><b>${escape(player.name)}</b></td><td>${escape(player.team)}</td><td>${player.roles.map(roleBadge).join('')}</td><td>${player.qt}</td><td>${player.fvm}</td><td><button data-action="edit-player" data-id="${player.id}" class="quiet small">Modifica</button>${assignedIds().has(player.id) ? '' : ` <button data-action="delete-player" data-id="${player.id}" class="danger">Elimina</button>`}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function render() { document.title = state ? `Asta ${rules().label}` : 'Tool asta fantacalcio'; root.innerHTML = state ? `${header()}${navigation()}<main>${tab === 'asta' ? auction() : tab === 'squadre' ? teams() : tab === 'strategia' ? strategy() : catalogue()}</main>` : setupScreen(); }
function selectPlayer(id) { selectedPlayerId = id; feedback = `${playerFor(id)?.name} selezionato. Inserisci prezzo e squadra.`; render(); }

root.addEventListener('click', (event) => {
  const target = event.target; const playerRow = target.closest?.('[data-action="select-player"]');
  if (playerRow) { selectPlayer(playerRow.dataset.id); return; }
  if (target.dataset.sortTable) { const current = tableSort[target.dataset.sortTable]; const direction = current.key === target.dataset.sortKey && current.direction === 'asc' ? 'desc' : 'asc'; tableSort = { ...tableSort, [target.dataset.sortTable]: { key: target.dataset.sortKey, direction } }; render(); return; }
  if (target.dataset.tab) { tab = target.dataset.tab; render(); return; }
  if (target.dataset.action === 'undo') { state = { ...state, assignments: state.assignments.slice(0, -1) }; persist(); render(); return; }
  if (target.dataset.action === 'remove') { state = { ...state, assignments: state.assignments.filter((assignment) => assignment.playerId !== target.dataset.id) }; persist(); render(); return; }
  if (target.dataset.action === 'reset') { if (confirm('Creare una nuova asta? I dati correnti verranno rimossi dal browser.')) { state = null; localStorage.removeItem('tool-asta-mantra-state-v1'); tab = 'asta'; render(); } return; }
  if (target.dataset.action === 'export') { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([exportState(state)], { type: 'application/json' })); link.download = `asta-${state.setup}-backup.json`; link.click(); URL.revokeObjectURL(link.href); return; }
  if (target.dataset.action === 'new-player') { root.querySelector('#player-form').hidden = false; return; }
  if (target.dataset.action === 'delete-player' && confirm('Eliminare questo giocatore?')) { state = { ...state, players: state.players.filter((player) => player.id !== target.dataset.id) }; persist(); render(); return; }
  if (target.dataset.action === 'edit-player') { const player = playerFor(target.dataset.id); const form = root.querySelector('#player-form'); form.hidden = false; Object.entries(player).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = Array.isArray(value) ? value.join('/') : value; }); }
});

root.addEventListener('keydown', (event) => { const row = event.target.closest?.('[data-action="select-player"]'); if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectPlayer(row.dataset.id); } });
root.addEventListener('input', (event) => { if (!event.target.dataset.filter) return; const cursor = event.target.selectionStart; filters = { ...filters, [event.target.dataset.filter]: event.target.value }; render(); const input = root.querySelector(`[data-filter="${event.target.dataset.filter}"]`); input?.focus(); input?.setSelectionRange?.(cursor, cursor); });
root.addEventListener('change', async (event) => {
  if (event.target.name === 'setup') { const form = event.target.closest('form'); const selectedRules = setupRules(event.target.value); form.elements.teamCount.value = selectedRules.defaultTeams; form.elements.budget.value = selectedRules.defaultBudget; form.querySelector('button').textContent = `Crea asta ${selectedRules.label}`; return; }
  if (event.target.name === 'teamId' && event.target.closest('#sale-form')) { selectedTeamId = event.target.value; render(); return; }
  if (event.target.name === 'ownTeamId' && event.target.closest('#strategy-form')) { state = { ...state, ownTeamId: event.target.value }; persist(); render(); return; }
  if (event.target.dataset.action === 'import') { try { state = importState(await event.target.files[0].text()); selectedPlayerId = ''; selectedTeamId = ''; persist(); render(); } catch { alert('Backup non valido'); } }
});

root.addEventListener('submit', (event) => {
  event.preventDefault(); const form = new FormData(event.target);
  try {
    if (event.target.id === 'setup-form') { const setup = form.get('setup'); state = createSetup(setup, setup === 'classic' ? classicPlayers : mantraPlayers, { teamCount: Number(form.get('teamCount')), budget: Number(form.get('budget')), ownTeamName: form.get('ownTeamName') }); persist(); render(); return; }
    if (event.target.id === 'league-size-form') { state = resizeLeague(state, Number(form.get('teamCount'))); persist(); render(); return; }
    if (event.target.id === 'sale-form') { const player = playerFor(form.get('playerId')); const teamId = form.get('teamId'); const compatible = assignableRoles(state, player, teamId); const budgetRole = compatible.includes(form.get('budgetRole')) ? form.get('budgetRole') : compatible[0]; const assignment = { playerId: form.get('playerId'), teamId, price: Number(form.get('price')), budgetRole }; const summary = teamSummary(state, teamId); if (summary.remaining - assignment.price < 0 && !confirm('Il budget diventerebbe negativo. Continuare?')) return; state = assignPlayer(state, assignment); feedback = `${player.name} assegnato per ${assignment.price} crediti.`; selectedPlayerId = ''; persist(); render(); return; }
    if (event.target.classList.contains('team-name-form')) { state = renameTeam(state, form.get('teamId'), form.get('teamName')); persist(); render(); return; }
    if (event.target.id === 'strategy-form') { const ownTeamId = form.get('ownTeamId'); const current = state.teams.find((team) => team.id === ownTeamId); const updatedTeam = { ...current, name: form.get('teamName').trim() || current.name, budget: Number(form.get('budget')), rosterSize: state.setup === 'classic' ? 25 : Number(form.get('rosterSize')) }; let strategy = state.strategy; if (state.setup === 'mantra') strategy = { ...state.strategy, roleBudgets: Object.fromEntries(Object.keys(state.strategy.roleBudgets).map((role) => [role, Object.fromEntries(['slots', 'min', 'target', 'max'].map((field) => [field, Number(form.get(`${role}-${field}`))]))])) }; state = { ...state, ownTeamId, teams: state.teams.map((team) => team.id === ownTeamId ? updatedTeam : team), strategy }; persist(); render(); return; }
    if (event.target.id === 'player-form') { const player = validatePlayer(state.setup, { id: form.get('id').trim(), name: form.get('name').trim(), team: form.get('team').trim(), roles: form.get('roles').split('/'), qt: Number(form.get('qt')), fvm: Number(form.get('fvm')) }); state = { ...state, players: playerFor(player.id) ? state.players.map((entry) => entry.id === player.id ? player : entry) : [...state.players, player] }; persist(); render(); }
  } catch (error) { feedback = error.message; alert(error.message); render(); }
});

render();
