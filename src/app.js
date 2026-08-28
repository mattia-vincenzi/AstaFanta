import players from './players.json' with { type: 'json' };
import { allowedBudgetRoles, assignPlayer, createInitialState, opponentSummaries, ownRoleSummaries, renameTeam, resizeLeague, strategyWarnings, teamSummary } from './domain.js';
import { exportState, importState, loadState, saveState } from './storage.js';
import { filterPlayers, selectedPlayerLabel, suggestedBudgetRole, sortRows } from './render.js';

const root = document.querySelector('#app');
const freshState = () => createInitialState(players);
let state = loadState(localStorage, freshState());
let tab = 'asta';
let filters = { query: '', role: '', availability: 'free' };
let selectedPlayerId = '';
let tableSort = { opponents: { key: 'remaining', direction: 'desc' }, catalogue: { key: 'name', direction: 'asc' } };
let feedback = '';

const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const persist = () => saveState(localStorage, state);
const ownTeam = () => state.teams.find((team) => team.id === state.ownTeamId);
const assignedIds = () => new Set(state.assignments.map((entry) => entry.playerId));
const playerFor = (id) => state.players.find((player) => player.id === id);
const sortable = (table, key, label) => `<button class="sort" data-sort-table="${table}" data-sort-key="${key}">${label}${tableSort[table]?.key === key ? (tableSort[table].direction === 'asc' ? ' ▲' : ' ▼') : ''}</button>`;

function header() {
  const summary = teamSummary(state, state.ownTeamId);
  return `<header><div><h1>Asta Mantra</h1><p>${escape(ownTeam().name)} · ${summary.remaining} crediti · ${summary.slotsRemaining} slot</p></div><p class="sr-only" aria-live="polite">${escape(feedback)}</p><div class="backup"><button data-action="export">Esporta backup</button><label class="button">Importa backup<input data-action="import" type="file" accept="application/json" hidden></label><button data-action="reset" class="quiet">Reset</button></div></header>`;
}

function navigation() {
  return `<nav>${[['asta', 'Asta live'], ['squadre', 'Squadre'], ['strategia', 'Strategia'], ['catalogo', 'Catalogo']].map(([id, label]) => `<button class="${tab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}</nav>`;
}

function dashboard() {
  const mine = teamSummary(state, state.ownTeamId);
  const roles = ownRoleSummaries(state);
  const opponents = sortRows(opponentSummaries(state), tableSort.opponents.key, tableSort.opponents.direction);
  return `<section class="command-center"><div class="hero-kpi"><span>Budget disponibile</span><strong>${mine.remaining}</strong><small>${mine.spent} spesi · ${mine.slotsRemaining} slot liberi</small></div><div class="role-overview"><h2>La mia spesa per ruolo</h2><div class="role-cards">${roles.map((item) => { const status = item.maximum && item.spent > item.maximum ? 'danger' : item.target && item.spent > item.target ? 'warning' : ''; const pct = item.target ? Math.min(100, Math.round((item.spent / item.target) * 100)) : 0; return `<article class="role-card ${status}"><b>${item.role}</b><span>${item.spent} / ${item.target || '—'}</span><div class="meter"><i style="width:${pct}%"></i></div><small>${item.remaining >= 0 ? item.remaining : 0} crediti al target</small></article>`; }).join('')}</div></div><div class="opponents"><h2>Altre squadre</h2><table><thead><tr><th>${sortable('opponents', 'name', 'Squadra')}</th><th>${sortable('opponents', 'remaining', 'Residuo')}</th><th>${sortable('opponents', 'spent', 'Spesi')}</th><th>${sortable('opponents', 'players', 'Rosa')}</th></tr></thead><tbody>${opponents.map((team) => `<tr><td>${escape(team.name)}</td><td><b>${team.remaining}</b></td><td>${team.spent}</td><td>${team.players}/${team.rosterSize}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function auction() {
  const available = filterPlayers(state.players, assignedIds(), filters).slice(0, 120);
  const roles = ['P', 'D', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
  const selected = playerFor(selectedPlayerId);
  return `${dashboard()}<section class="grid"><article class="panel"><h2>Registra cessione</h2><form id="sale-form"><input name="playerId" type="hidden" value="${escape(selectedPlayerId)}"><label>Giocatore selezionato<input value="${escape(selected ? selectedPlayerLabel(selected) : 'Cerca e seleziona dal catalogo')}" readonly></label><label>Squadra<select name="teamId">${state.teams.map((t) => `<option value="${t.id}">${escape(t.name)}</option>`).join('')}</select></label><label>Prezzo<input name="price" type="number" min="1" required></label><label>Ruolo budget<select name="budgetRole">${roles.map((role) => `<option>${role}</option>`).join('')}</select></label><button ${selected ? '' : 'disabled'}>Conferma cessione</button></form>${state.assignments.length ? '<button class="quiet" data-action="undo">Annulla ultima cessione</button>' : ''}</article><article class="panel"><h2>Catalogo libero</h2><div class="filters"><input data-filter="query" placeholder="Cerca nome o squadra" value="${escape(filters.query)}" autocomplete="off"><select data-filter="role"><option value="">Tutti i ruoli</option>${roles.map((role) => `<option ${filters.role === role ? 'selected' : ''}>${role}</option>`).join('')}</select></div><p class="muted">Clicca un giocatore per selezionarlo · ${available.length} giocatori mostrati</p><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Squadra</th><th>Ruoli</th><th>Qt</th><th>FVM</th></tr></thead><tbody>${available.map((p) => `<tr class="selectable ${p.id === selectedPlayerId ? 'selected' : ''}" data-action="select-player" data-id="${p.id}"><td>${escape(p.name)}</td><td>${escape(p.team)}</td><td>${p.roles.join('/')}</td><td>${p.qt}</td><td>${p.fvm}</td></tr>`).join('')}</tbody></table></div></article></section>`;
}

function teams() {
  return `<section class="panel"><div class="section-heading"><div><h2>Squadre della lega</h2><p class="muted">Gestisci la composizione della lega senza influire sulla tua Strategia.</p></div><form id="league-size-form" class="league-size-form"><label>Numero squadre<input name="teamCount" type="number" min="2" value="${state.teams.length}"></label><button>Applica</button></form></div><div class="cards">${state.teams.map((team) => { const s = teamSummary(state, team.id); const used = Math.min(100, Math.round((s.spent / team.budget) * 100)); return `<article class="card team-card"><h3>${escape(team.name)}</h3><form class="team-name-form"><input name="teamId" type="hidden" value="${team.id}"><label>Nome squadra<input name="teamName" value="${escape(team.name)}" required></label><button>Salva nome</button></form><strong>${s.remaining}</strong> crediti residui<div class="meter"><i style="width:${used}%"></i></div><span>${s.players}/${team.rosterSize} giocatori · ${s.spent} spesi</span><details><summary>Vedi rosa</summary>${state.assignments.filter((a) => a.teamId === team.id).map((a) => { const p = playerFor(a.playerId); return `<p>${escape(p?.name)} — ${a.price} (${a.budgetRole}) <button data-action="remove" data-id="${a.playerId}">rimuovi</button></p>`; }).join('') || '<p class="muted">Nessun acquisto</p>'}</details></article>`; }).join('')}</div></section>`;
}

function strategy() {
  const summary = teamSummary(state, state.ownTeamId);
  const budgets = state.strategy?.roleBudgets || {};
  const warnings = strategyWarnings(state);
  return `<section class="panel"><h2>Strategia</h2><p class="muted">Questi valori generano avvisi, ma non bloccano l'asta.</p><form id="strategy-form"><div class="strategy-top"><label>La mia squadra<select name="ownTeamId">${state.teams.map((t) => `<option value="${t.id}" ${t.id === state.ownTeamId ? 'selected' : ''}>${escape(t.name)}</option>`).join('')}</select></label><label>Nome squadra<input name="teamName" value="${escape(ownTeam().name)}"></label><label>Budget iniziale<input name="budget" type="number" min="1" value="${ownTeam().budget}"></label><label>Dimensione rosa<input name="rosterSize" type="number" min="1" value="${ownTeam().rosterSize}"></label></div><h3>Budget per ruolo</h3><div class="table-wrap"><table><thead><tr><th>Ruolo</th><th>Slot</th><th>Minimo</th><th>Obiettivo</th><th>Massimo</th></tr></thead><tbody>${Object.entries(budgets).map(([role, value]) => `<tr><td>${role}</td>${['slots', 'min', 'target', 'max'].map((field) => `<td><input name="${role}-${field}" type="number" min="0" value="${value[field]}"></td>`).join('')}</tr>`).join('')}</tbody></table></div><button>Salva configurazione</button></form>${warnings.length ? `<div class="warnings">${warnings.map((warning) => `Attenzione: ${warning.role} supera il massimo (${warning.spent}/${warning.limit}).`).join('<br>')}</div>` : ''}<hr><h3>Situazione attuale</h3><p>Spesi ${summary.spent} · Residuo ${summary.remaining} · Slot ${summary.slotsRemaining}</p></section>`;
}

function catalogue() {
  return `<section class="panel"><div class="section-heading"><div><h2>Catalogo modificabile</h2><p class="muted">Aggiungi o correggi giocatori. Gli assegnati non si possono eliminare.</p></div><button data-action="new-player">Aggiungi giocatore</button></div><form id="player-form" class="player-form" hidden><input name="id" placeholder="ID univoco" required><input name="name" placeholder="Nome" required><input name="team" placeholder="Squadra" required><input name="roles" placeholder="Ruoli, es. M/C" required><input name="qt" type="number" placeholder="Qt" value="0"><input name="fvm" type="number" placeholder="FVM" value="0"><button>Salva giocatore</button></form><div class="table-wrap"><table><thead><tr><th>ID</th><th>Nome</th><th>Squadra</th><th>Ruoli</th><th></th></tr></thead><tbody>${state.players.map((p) => `<tr><td>${p.id}</td><td>${escape(p.name)}</td><td>${escape(p.team)}</td><td>${p.roles.join('/')}</td><td><button data-action="edit-player" data-id="${p.id}">Modifica</button>${assignedIds().has(p.id) ? '' : ` <button data-action="delete-player" data-id="${p.id}" class="danger">Elimina</button>`}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function render() { root.innerHTML = `${header()}${navigation()}<main>${tab === 'asta' ? auction() : tab === 'squadre' ? teams() : tab === 'strategia' ? strategy() : catalogue()}</main>`; }

root.addEventListener('click', (event) => {
  const target = event.target;
  if (target.dataset.sortTable) { const current = tableSort[target.dataset.sortTable]; const direction = current.key === target.dataset.sortKey && current.direction === 'asc' ? 'desc' : 'asc'; tableSort = { ...tableSort, [target.dataset.sortTable]: { key: target.dataset.sortKey, direction } }; render(); return; }
  if (target.dataset.tab) { tab = target.dataset.tab; render(); }
  if (target.dataset.action === 'undo') { state = { ...state, assignments: state.assignments.slice(0, -1) }; persist(); render(); }
  if (target.closest('[data-action="select-player"]')) { selectedPlayerId = target.closest('[data-action="select-player"]').dataset.id; render(); }
  if (target.dataset.action === 'remove') { state = { ...state, assignments: state.assignments.filter((a) => a.playerId !== target.dataset.id) }; persist(); render(); }
  if (target.dataset.action === 'reset' && confirm('Ripristinare i dati iniziali?')) { state = freshState(); persist(); render(); }
  if (target.dataset.action === 'export') { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([exportState(state)], { type: 'application/json' })); link.download = 'asta-mantra-backup.json'; link.click(); URL.revokeObjectURL(link.href); }
  if (target.dataset.action === 'new-player') document.querySelector('#player-form').hidden = false;
  if (target.dataset.action === 'delete-player' && confirm('Eliminare questo giocatore?')) { state = { ...state, players: state.players.filter((p) => p.id !== target.dataset.id) }; persist(); render(); }
  if (target.dataset.action === 'edit-player') { const p = playerFor(target.dataset.id); const form = document.querySelector('#player-form'); form.hidden = false; Object.entries(p).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = Array.isArray(value) ? value.join('/') : value; }); }
});
root.addEventListener('input', (event) => { if (event.target.dataset.filter) { const cursor = event.target.selectionStart; filters = { ...filters, [event.target.dataset.filter]: event.target.value }; render(); const input = root.querySelector(`[data-filter="${event.target.dataset.filter}"]`); input?.focus(); input?.setSelectionRange(cursor, cursor); } });
root.addEventListener('change', async (event) => { if (event.target.dataset.action === 'import') { try { state = importState(await event.target.files[0].text()); persist(); render(); } catch { alert('Backup non valido'); } } });
root.addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.target); try { if (event.target.id === 'sale-form') { const assignment = { playerId: form.get('playerId'), teamId: form.get('teamId'), price: Number(form.get('price')), budgetRole: form.get('budgetRole') }; const summary = teamSummary(state, assignment.teamId); if (summary.remaining - assignment.price < 0 && !confirm('Il budget diventerebbe negativo. Continuare?')) return; state = assignPlayer(state, assignment); selectedPlayerId = ''; } else if (event.target.classList.contains('team-name-form')) { state = renameTeam(state, form.get('teamId'), form.get('teamName')); } else if (event.target.id === 'strategy-form') { const team = state.teams.find((t) => t.id === form.get('ownTeamId')); team.name = form.get('teamName').trim() || team.name; team.budget = Number(form.get('budget')); team.rosterSize = Number(form.get('rosterSize')); const roleBudgets = Object.fromEntries(Object.keys(state.strategy.roleBudgets).map((role) => [role, Object.fromEntries(['slots', 'min', 'target', 'max'].map((field) => [field, Number(form.get(`${role}-${field}`))]))])); state = { ...state, ownTeamId: team.id, strategy: { ...state.strategy, roleBudgets } }; } else { const player = { id: form.get('id').trim(), name: form.get('name').trim(), team: form.get('team').trim(), roles: form.get('roles').split('/').map((r) => r.trim()).filter(Boolean), qt: Number(form.get('qt')), fvm: Number(form.get('fvm')) }; if (!player.id || !player.name || !player.team || !player.roles.length) throw new Error('Compila tutti i campi obbligatori'); const existing = playerFor(player.id); if (existing) state = { ...state, players: state.players.map((p) => p.id === player.id ? player : p) }; else state = { ...state, players: [...state.players, player] }; } persist(); render(); } catch (error) { alert(error.message); } });
root.addEventListener('submit', (event) => {
  if (event.target.id !== 'league-size-form') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try { state = resizeLeague(state, Number(new FormData(event.target).get('teamCount'))); persist(); render(); } catch (error) { alert(error.message); }
}, true);
root.addEventListener('click', (event) => {
  const row = event.target.closest?.('[data-action="select-player"]');
  if (!row) return;
  event.stopImmediatePropagation();
  selectedPlayerId = row.dataset.id;
  feedback = `${playerFor(selectedPlayerId)?.name} selezionato. Inserisci prezzo e squadra.`;
  render();
}, true);
root.addEventListener('submit', (event) => {
  if (event.target.id !== 'sale-form') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const form = new FormData(event.target);
  try {
    const player = playerFor(form.get('playerId'));
    const compatible = allowedBudgetRoles(player);
    const budgetRole = compatible.includes(form.get('budgetRole')) ? form.get('budgetRole') : suggestedBudgetRole(compatible);
    const assignment = { playerId: form.get('playerId'), teamId: form.get('teamId'), price: Number(form.get('price')), budgetRole };
    state = assignPlayer(state, assignment);
    feedback = `${player.name} assegnato a ${state.teams.find((team) => team.id === assignment.teamId).name} per ${assignment.price} crediti.`;
    selectedPlayerId = '';
    persist(); render();
  } catch (error) { feedback = error.message; render(); }
}, true);
render();
