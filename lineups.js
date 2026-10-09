// Lineup Builder: interactive pitch, formations, drag & drop (mouse + touch), keyboard / control alternatives,
// starters, bench, captain, drafts, preview, publish / unpublish.
import { bootAdmin } from './shell.js';
import { adminAll, getAdminLineupsForMatch, listLineupStatusByMatch, saveLineupDraft, publishLineup, unpublishLineup, adminDelete, friendlyError } from '../api.js';
import { t, POSITIONS, posLabel } from '../i18n.js';
import { esc, pick, fmtDate, fmtTime, toast, loadingHtml, emptyHtml, errorHtml } from '../utils.js';
import { openModal, confirmDialog, withBusy, setDirty, isDirty } from './ui.js';
import { FORMATIONS, formationSlots, pitchHtml, markerHtml, lineupViewHtml } from '../lineup-view.js';
import { playerName, playerPhotoHtml } from '../ui.js';

const X_MIN = 4, X_MAX = 96, Y_MIN = 3, Y_MAX = 97;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r1 = (n) => Math.round(n * 10) / 10;

bootAdmin({ page: 'lineups', title: 'lb.title', render: build });

async function build(ctx) {
  const { main, lang } = ctx;
  const tz = ctx.settings.timezone || 'UTC';
  main.innerHTML = loadingHtml();
  let players, matches, statusMap;
  try {
    [players, matches, statusMap] = await Promise.all([
      adminAll('players', { order: [{ col: 'jersey_number' }, { col: 'full_name_en' }] }),
      adminAll('matches', { select: 'id,opponent_ar,opponent_en,kickoff_at,club_is_home,status', order: [{ col: 'kickoff_at', asc: false }] }),
      listLineupStatusByMatch()
    ]);
  } catch (e) { main.innerHTML = errorHtml(friendlyError(e), t('common.retry')); main.querySelector('[data-retry]').onclick = () => build(ctx); return; }
  if (!matches.length) { main.innerHTML = emptyHtml(t('lb.noMatches')); return; }
  const P = new Map(players.map((p) => [p.id, p]));
  const activePlayers = players.filter((p) => p.is_active);

  /* ------------------------------ state ------------------------------ */
  const S = { matchId: '', lineupId: null, draftExists: false, published: null, formation: '4-3-3', coach_name_ar: '', coach_name_en: '', notes_ar: '', notes_en: '',
    starters: [], bench: [], sel: null, search: '' };
  const markDirty = () => { setDirty(true); drawBar(); };
  const nameOf = (id) => playerName(P.get(id) || {}, lang);

  main.innerHTML = `<div class="lb">
    <div class="card lb-bar"><div class="lb-bar-grid">
      <label class="field"><span>${esc(t('lb.match'))}</span><select id="lb-match"><option value="">${esc(t('lb.chooseMatch'))}</option>
        ${matches.map((m) => { const st = statusMap[m.id] || {}; return `<option value="${m.id}">${st.published ? '✓ ' : st.draft ? '✎ ' : ''}${esc(fmtDate(m.kickoff_at, lang, tz, { day: 'numeric', month: 'short', year: 'numeric' }))} — ${esc(pick(m, 'opponent', lang))}</option>`; }).join('')}</select></label>
      <label class="field"><span>${esc(t('lb.formation'))}</span><select id="lb-formation" disabled>
        ${[...Object.keys(FORMATIONS), 'custom'].map((f) => `<option value="${f}">${f === 'custom' ? esc(t('lineup.custom')) : f}</option>`).join('')}</select></label>
      <div id="lb-status" class="lb-status"></div></div>
      <div id="lb-actions" class="lb-actions"></div></div>
    <div id="lb-work" hidden><div class="lb-grid">
      <div class="lb-col"><div class="card"><h2>${esc(t('lb.available'))}</h2><input id="lb-search" type="search" placeholder="${esc(t('lb.searchPlayers'))}" aria-label="${esc(t('lb.searchPlayers'))}"><div id="lb-plist" class="plist"></div></div>
        <div class="card"><div class="form-grid">
          <label class="field"><span>${esc(t('lb.coachAr'))}</span><input id="coach_name_ar" dir="rtl"></label><label class="field"><span>${esc(t('lb.coachEn'))}</span><input id="coach_name_en" dir="ltr"></label>
          <label class="field span-2"><span>${esc(t('lb.notesAr'))}</span><textarea id="notes_ar" dir="rtl" rows="2"></textarea></label>
          <label class="field span-2"><span>${esc(t('lb.notesEn'))}</span><textarea id="notes_en" dir="ltr" rows="2"></textarea></label></div></div></div>
      <div class="lb-col"><p class="note">${esc(t('lb.dragHint'))}</p><div id="lb-pitch" class="lb-pitch"></div><p id="lb-counts" class="note"></p></div>
      <div class="lb-col"><div class="card" id="lb-panel"></div><div class="card"><h2>${esc(t('lb.bench'))}</h2><div id="lb-bench" class="plist"></div></div></div></div></div></div>`;

  const $q = (s) => main.querySelector(s);

  /* ------------------------------ loading a match ------------------------------ */
  async function loadMatch(id) {
    S.matchId = id; S.sel = null;
    if (!id) { $q('#lb-work').hidden = true; $q('#lb-formation').disabled = true; drawBar(); return; }
    $q('#lb-work').hidden = false; $q('#lb-pitch').innerHTML = loadingHtml();
    try {
      const { draft, published } = await getAdminLineupsForMatch(id);
      S.published = published; S.draftExists = !!draft;
      const src = draft || published;
      S.lineupId = draft ? draft.id : null;
      S.formation = src?.formation || '4-3-3';
      for (const k of ['coach_name_ar', 'coach_name_en', 'notes_ar', 'notes_en']) { S[k] = src?.[k] || ''; $q(`#${k}`).value = S[k]; }
      const rows = src?.lineup_players || [];
      S.starters = rows.filter((r) => r.role === 'starter').sort((a, b) => a.display_order - b.display_order)
        .map((r) => ({ player_id: r.player_id, x: +r.x_percent, y: +r.y_percent, label: r.position_label || '', captain: r.is_captain }));
      S.bench = rows.filter((r) => r.role === 'bench').sort((a, b) => a.bench_order - b.bench_order).map((r) => r.player_id);
      setDirty(false); $q('#lb-formation').disabled = false; $q('#lb-formation').value = S.formation;
      drawAll();
    } catch (e) { $q('#lb-pitch').innerHTML = errorHtml(friendlyError(e), t('common.retry')); $q('#lb-pitch .btn').onclick = () => loadMatch(id); }
  }

  /* ------------------------------ drawing ------------------------------ */
  function drawBar() {
    const dirty = isDirty(); const publishedOnly = S.published && !S.draftExists;
    const stateKey = !S.matchId ? '' : S.draftExists ? (S.published ? 'lb.state.publishedWithDraft' : 'lb.state.draft') : S.published ? 'lb.state.published' : 'lb.state.new';
    $q('#lb-status').innerHTML = stateKey ? `<span class="badge ${S.published && !S.draftExists ? 'res-W' : ''}">${esc(t(stateKey))}</span>
      <span class="${dirty ? 'dirty-flag' : 'clean-flag'}">${esc(dirty ? t('lb.dirty') : t('lb.clean'))}</span>` : '';
    const a = $q('#lb-actions');
    if (!S.matchId) { a.innerHTML = ''; return; }
    a.innerHTML = `${publishedOnly && !dirty ? `<p class="note span-all">${esc(t('lb.publishedReadonly'))}</p>` : ''}
      <button class="btn btn-primary" data-act="save" ${dirty ? '' : 'disabled'}>${esc(t('lb.saveDraft'))}</button>
      <button class="btn" data-act="preview">${esc(t('lb.preview'))}</button>
      <button class="btn btn-primary" data-act="publish" ${S.lineupId && !dirty ? '' : 'disabled'} ${S.lineupId && !dirty ? '' : `title="${esc(t('lb.saveFirst'))}"`}>${esc(t('lb.publish'))}</button>
      ${publishedOnly ? `<button class="btn" data-act="unpublish">${esc(t('lb.unpublish'))}</button>` : ''}
      ${S.draftExists ? `<button class="btn btn-danger" data-act="discard">${esc(t('lb.discard'))}</button>` : publishedOnly ? `<button class="btn btn-danger" data-act="delete">${esc(t('lb.deleteLineup'))}</button>` : ''}`;
    $q('#lb-counts').textContent = t('lb.counts', { s: S.starters.length, b: S.bench.length });
  }

  function drawPitch() {
    const markers = S.starters.map((s) => markerHtml(P.get(s.player_id) || {}, lang, { x: s.x, y: s.y, captain: s.captain, label: s.label,
      attrs: `data-sid="${esc(s.player_id)}"`, cls: S.sel?.kind === 'starter' && S.sel.id === s.player_id ? 'selected' : '' })).join('');
    $q('#lb-pitch').innerHTML = `<div class="pitch-wrap">${pitchHtml(markers, 'pitch-edit')}</div>`;
  }

  const row = (p, extra) => `<div class="prow ${S.sel?.id === p.id ? 'selected' : ''}" data-pid="${esc(p.id)}" draggable="${extra.drag ? 'true' : 'false'}">
    <span class="prow-ph">${playerPhotoHtml(p, lang, 'thumb')}</span><span class="prow-name"><b>${p.jersey_number != null ? esc(p.jersey_number) : '–'}</b> ${esc(playerName(p, lang))}
    <small>${esc(posLabel(p.position))}${!p.is_published ? ` · ${esc(t('common.hidden'))}` : ''}${!p.is_active ? ` · ${esc(t('lb.inactiveNote'))}` : ''}</small></span>${extra.buttons || ''}</div>`;

  function drawLists() {
    const used = new Set([...S.starters.map((s) => s.player_id), ...S.bench]);
    const q = S.search.trim().toLowerCase();
    const avail = activePlayers.filter((p) => !used.has(p.id) && (!q || `${p.full_name_ar || ''} ${p.full_name_en || ''} ${p.jersey_number ?? ''}`.toLowerCase().includes(q)));
    $q('#lb-plist').innerHTML = !activePlayers.length ? emptyHtml(t('lb.noPlayers')) : avail.length ? avail.map((p) => row(p, { drag: true, buttons:
      `<span class="prow-btns"><button type="button" class="btn btn-sm" data-add="starter" data-pid="${esc(p.id)}" ${S.starters.length >= 11 ? 'disabled' : ''}>${esc(t('lb.toPitch'))}</button>
       <button type="button" class="btn btn-sm" data-add="bench" data-pid="${esc(p.id)}">${esc(t('lb.toBench'))}</button></span>` })).join('') : `<p class="note">${esc(t('lb.allUsed'))}</p>`;
    $q('#lb-bench').innerHTML = S.bench.length ? S.bench.map((id, i) => row(P.get(id) || { id }, { buttons:
      `<span class="prow-btns"><button type="button" class="btn btn-sm" data-bench-sel="${esc(id)}">${esc(t('common.edit'))}</button>
       <button type="button" class="btn btn-sm" data-bench-move="-1" data-pid="${esc(id)}" ${i === 0 ? 'disabled' : ''} aria-label="${esc(t('lb.up'))}">↑</button>
       <button type="button" class="btn btn-sm" data-bench-move="1" data-pid="${esc(id)}" ${i === S.bench.length - 1 ? 'disabled' : ''} aria-label="${esc(t('lb.down'))}">↓</button></span>` })).join('') : `<p class="note">${esc(t('empty.players'))}</p>`;
  }

  function drawPanel() {
    const panel = $q('#lb-panel');
    const sel = S.sel; const p = sel && P.get(sel.id);
    if (!p) { panel.innerHTML = `<h2>${esc(t('lb.selected'))}</h2><p class="note">${esc(t('lb.noSelection'))}</p>`; return; }
    const st = sel.kind === 'starter' ? S.starters.find((s) => s.player_id === sel.id) : null;
    const used = new Set([...S.starters.map((s) => s.player_id), ...S.bench]);
    const repl = activePlayers.filter((x) => !used.has(x.id));
    panel.innerHTML = `<h2>${esc(t('lb.selected'))}</h2><p class="sel-name"><b>${p.jersey_number != null ? esc(p.jersey_number) : '–'}</b> ${esc(playerName(p, lang))}</p>
      ${st ? `<label class="field"><span>${esc(t('lb.posX'))} (${st.x}%)</span><input type="range" min="${X_MIN}" max="${X_MAX}" step="0.5" value="${st.x}" data-pos="x"></label>
        <label class="field"><span>${esc(t('lb.posY'))} (${st.y}%)</span><input type="range" min="${Y_MIN}" max="${Y_MAX}" step="0.5" value="${st.y}" data-pos="y"></label>
        <div class="nudge" role="group" aria-label="${esc(t('lb.nudge'))}"><button type="button" class="btn btn-sm" data-nudge="-2,0">←</button><button type="button" class="btn btn-sm" data-nudge="0,-2">↑</button>
          <button type="button" class="btn btn-sm" data-nudge="0,2">↓</button><button type="button" class="btn btn-sm" data-nudge="2,0">→</button></div>
        <label class="field"><span>${esc(t('lb.posLabel'))}</span><select data-label>${['', ...POSITIONS].map((x) => `<option value="${x}" ${x === st.label ? 'selected' : ''}>${x ? `${posLabel(x)} (${x})` : '—'}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" data-captain ${st.captain ? 'checked' : ''}><span>${esc(t('lb.captain'))}</span></label>` : ''}
      <label class="field"><span>${esc(t('lb.replace'))}</span><select data-replace><option value="">${esc(t('lb.replacePick'))}</option>
        ${repl.map((x) => `<option value="${esc(x.id)}">${x.jersey_number != null ? `${esc(x.jersey_number)} ` : ''}${esc(playerName(x, lang))}</option>`).join('')}</select></label>
      <div class="dlg-actions">${st ? `<button type="button" class="btn" data-to-bench>${esc(t('lb.moveBench'))}</button>`
        : `<button type="button" class="btn" data-to-start ${S.starters.length >= 11 ? 'disabled' : ''}>${esc(t('lb.moveStarter'))}</button>`}
        <button type="button" class="btn btn-danger" data-remove>${esc(t('lb.remove'))}</button></div>`;
  }
  function drawAll() { drawBar(); drawPitch(); drawLists(); drawPanel(); }

  /* ------------------------------ mutations ------------------------------ */
  const firstFreeSlot = () => (formationSlots(S.formation) || []).find((sl) => !S.starters.some((s) => Math.hypot(s.x - sl.x, s.y - sl.y) < 7));
  function addStarter(id, x, y) {
    if (S.starters.length >= 11) return toast(t('lb.pitchFull'), 'error');
    const p = P.get(id); let label = p?.position || '';
    if (x == null) { const sl = firstFreeSlot(); if (sl) { x = sl.x; y = sl.y; label = sl.label; } else { x = 50; y = 50; } }
    S.bench = S.bench.filter((b) => b !== id);
    S.starters.push({ player_id: id, x: r1(clamp(x, X_MIN, X_MAX)), y: r1(clamp(y, Y_MIN, Y_MAX)), label, captain: false });
    S.sel = { kind: 'starter', id }; markDirty(); drawAll();
  }
  function addBench(id) {
    S.starters = S.starters.filter((s) => s.player_id !== id); if (!S.bench.includes(id)) S.bench.push(id);
    S.sel = { kind: 'bench', id }; markDirty(); drawAll();
  }
  function applyFormation(name) {
    S.formation = name; const slots = formationSlots(name); if (!slots) return;
    const st = [...S.starters]; const gi = st.findIndex((s) => s.label === 'GK' || P.get(s.player_id)?.position === 'GK');
    const ordered = []; if (gi > -1) ordered.push(st.splice(gi, 1)[0]);
    st.sort((a, b) => b.y - a.y || a.x - b.x); ordered.push(...st);
    ordered.forEach((s, i) => { const sl = slots[(gi > -1 ? 0 : 1) + i]; if (sl) { s.x = sl.x; s.y = sl.y; s.label = sl.label; } });
  }

  /* ------------------------------ events ------------------------------ */
  $q('#lb-match').addEventListener('change', async (e) => {
    const next = e.target.value;
    if (isDirty() && !(await confirmDialog(t('admin.leave')))) { e.target.value = S.matchId; return; }
    setDirty(false); loadMatch(next);
  });
  $q('#lb-formation').addEventListener('change', async (e) => {
    const name = e.target.value;
    if (name !== 'custom' && S.starters.length && !(await confirmDialog(t('lb.confirmFormation')))) { e.target.value = S.formation; return; }
    applyFormation(name); markDirty(); drawPitch(); drawPanel();
  });
  for (const k of ['coach_name_ar', 'coach_name_en', 'notes_ar', 'notes_en']) $q(`#${k}`).addEventListener('input', (e) => { S[k] = e.target.value; markDirty(); });
  $q('#lb-search').addEventListener('input', (e) => { S.search = e.target.value; drawLists(); });

  main.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]'); if (add) return add.dataset.add === 'starter' ? addStarter(add.dataset.pid) : addBench(add.dataset.pid);
    const bs = e.target.closest('[data-bench-sel]'); if (bs) { S.sel = { kind: 'bench', id: bs.dataset.benchSel }; drawLists(); drawPanel(); return; }
    const bm = e.target.closest('[data-bench-move]');
    if (bm) { const i = S.bench.indexOf(bm.dataset.pid), j = i + Number(bm.dataset.benchMove); [S.bench[i], S.bench[j]] = [S.bench[j], S.bench[i]]; markDirty(); drawLists(); return; }
    const row2 = e.target.closest('.prow[data-pid]'); if (row2 && !e.target.closest('button') && S.bench.includes(row2.dataset.pid)) { S.sel = { kind: 'bench', id: row2.dataset.pid }; drawLists(); drawPanel(); return; }
    const nd = e.target.closest('[data-nudge]');
    if (nd && S.sel) { const s = S.starters.find((q) => q.player_id === S.sel.id); const [dx, dy] = nd.dataset.nudge.split(',').map(Number);
      s.x = r1(clamp(s.x + dx, X_MIN, X_MAX)); s.y = r1(clamp(s.y + dy, Y_MIN, Y_MAX)); markDirty(); drawPitch(); drawPanel(); return; }
    if (e.target.closest('[data-to-bench]')) return addBench(S.sel.id);
    if (e.target.closest('[data-to-start]')) return addStarter(S.sel.id);
    if (e.target.closest('[data-remove]')) { const id = S.sel.id; S.starters = S.starters.filter((s) => s.player_id !== id); S.bench = S.bench.filter((b) => b !== id); S.sel = null; markDirty(); drawAll(); return; }
    const act = e.target.closest('[data-act]'); if (act) actions(act.dataset.act, act);
  });
  main.addEventListener('input', (e) => {
    const pos = e.target.closest('[data-pos]'); if (!pos || !S.sel) return;
    const s = S.starters.find((q) => q.player_id === S.sel.id); s[pos.dataset.pos] = r1(clamp(+pos.value, pos.dataset.pos === 'x' ? X_MIN : Y_MIN, pos.dataset.pos === 'x' ? X_MAX : Y_MAX));
    markDirty(); drawPitch();
  });
  main.addEventListener('change', (e) => {
    if (!S.sel) return; const s = S.starters.find((q) => q.player_id === S.sel.id);
    if (e.target.matches('[data-label]') && s) { s.label = e.target.value; markDirty(); drawPitch(); }
    if (e.target.matches('[data-captain]') && s) { S.starters.forEach((q) => { q.captain = false; }); s.captain = e.target.checked; markDirty(); drawPitch(); }
    if (e.target.matches('[data-replace]') && e.target.value) {
      const to = e.target.value, from = S.sel.id;
      if (s) s.player_id = to; else S.bench[S.bench.indexOf(from)] = to;
      S.sel = { kind: S.sel.kind, id: to }; markDirty(); drawAll();
    }
  });

  /* drag from the list onto the pitch (mouse); touch users use the buttons / controls */
  main.addEventListener('dragstart', (e) => { const r = e.target.closest('.prow[draggable=true]'); if (r) e.dataTransfer.setData('text/plain', r.dataset.pid); });
  main.addEventListener('dragover', (e) => { if (e.target.closest('.pitch')) e.preventDefault(); });
  main.addEventListener('drop', (e) => {
    const pitch = e.target.closest('.pitch'); if (!pitch) return; e.preventDefault();
    const id = e.dataTransfer.getData('text/plain'); if (!P.has(id)) return;
    const b = pitch.getBoundingClientRect();
    addStarter(id, ((e.clientX - b.left) / b.width) * 100, ((e.clientY - b.top) / b.height) * 100);
  });

  /* pointer dragging of markers (mouse + touch + pen) and arrow-key nudging */
  let drag = null;
  main.addEventListener('pointerdown', (e) => {
    const m = e.target.closest('.pitch-edit .pm'); if (!m) return;
    const id = m.dataset.sid; S.sel = { kind: 'starter', id };
    main.querySelectorAll('.pm.selected').forEach((x) => x.classList.remove('selected')); m.classList.add('selected');
    drag = { id, m, pitch: m.closest('.pitch'), sx: e.clientX, sy: e.clientY, moved: false }; m.setPointerCapture(e.pointerId); drawLists(); drawPanel();
  });
  main.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
    drag.moved = true; drag.m.classList.add('dragging');
    const b = drag.pitch.getBoundingClientRect();
    const x = clamp(((e.clientX - b.left) / b.width) * 100, X_MIN, X_MAX), y = clamp(((e.clientY - b.top) / b.height) * 100, Y_MIN, Y_MAX);
    drag.m.style.left = `${x}%`; drag.m.style.top = `${y}%`; drag.x = r1(x); drag.y = r1(y);
  });
  const endDrag = () => {
    if (!drag) return; const d = drag; drag = null; d.m.classList.remove('dragging');
    if (d.moved) { const s = S.starters.find((q) => q.player_id === d.id); s.x = d.x; s.y = d.y; markDirty(); drawPanel(); }
  };
  main.addEventListener('pointerup', endDrag); main.addEventListener('pointercancel', endDrag);
  main.addEventListener('keydown', (e) => {
    const m = e.target.closest('.pitch-edit .pm'); const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!m || !k) return; e.preventDefault();
    const s = S.starters.find((q) => q.player_id === m.dataset.sid), step = e.shiftKey ? 5 : 1;
    s.x = r1(clamp(s.x + k[0] * step, X_MIN, X_MAX)); s.y = r1(clamp(s.y + k[1] * step, Y_MIN, Y_MAX)); S.sel = { kind: 'starter', id: s.player_id };
    markDirty(); drawPitch(); drawPanel(); main.querySelector(`.pitch-edit .pm[data-sid="${s.player_id}"]`)?.focus();
  });

  /* ------------------------------ actions ------------------------------ */
  const payload = () => ({ formation: S.formation, coach_name_ar: S.coach_name_ar, coach_name_en: S.coach_name_en, notes_ar: S.notes_ar, notes_en: S.notes_en,
    players: [...S.starters.map((s) => ({ player_id: s.player_id, role: 'starter', position_label: s.label || null, x_percent: s.x, y_percent: s.y, is_captain: s.captain })),
      ...S.bench.map((id, i) => ({ player_id: id, role: 'bench', bench_order: i + 1 }))] });
  const toViewLineup = () => {
    const match = matches.find((m) => m.id === S.matchId);
    return { id: 'preview', formation: S.formation, coach_name_ar: S.coach_name_ar, coach_name_en: S.coach_name_en, notes_ar: S.notes_ar, notes_en: S.notes_en,
      match: { ...match, competition: null }, lineup_players: [
        ...S.starters.map((s, i) => ({ player_id: s.player_id, role: 'starter', position_label: s.label, x_percent: s.x, y_percent: s.y, is_captain: s.captain, display_order: i, player: P.get(s.player_id) })),
        ...S.bench.map((id, i) => ({ player_id: id, role: 'bench', bench_order: i + 1, display_order: 0, player: P.get(id) }))] };
  };
  async function refreshStatus() { try { Object.assign(statusMap, await listLineupStatusByMatch()); } catch { /* optional */ } }

  async function actions(act, btn) {
    try {
      if (act === 'save') return await withBusy(btn, async () => {
        S.lineupId = await saveLineupDraft(S.matchId, payload()); S.draftExists = true;
        setDirty(false); toast(t('lb.draftSaved')); await refreshStatus(); drawBar();
      });
      if (act === 'preview') {
        const m = openModal(t('lb.previewTitle'), `<p class="note">${esc(t('lb.previewNote'))}</p>${lineupViewHtml(toViewLineup(), ctx.settings, lang)}`, { wide: true });
        if (S.starters.some((s) => !P.get(s.player_id)?.is_published)) m.body.insertAdjacentHTML('afterbegin', `<p class="note">${esc(t('lb.unpublishedPlayerWarn'))}</p>`);
        return;
      }
      if (act === 'publish') {
        const gk = S.starters.filter((s) => s.label === 'GK').length;
        if (S.starters.length !== 11) return toast(t('err.need11'), 'error');
        if (gk !== 1) return toast(t('err.needGk'), 'error');
        if (!(await confirmDialog(t('lb.confirmPublish')))) return;
        return await withBusy(btn, async () => { await publishLineup(S.lineupId); toast(t('admin.published')); await refreshStatus(); await loadMatch(S.matchId); });
      }
      if (act === 'unpublish') {
        if (!(await confirmDialog(t('lb.confirmUnpublish')))) return;
        return await withBusy(btn, async () => { await unpublishLineup(S.published.id); toast(t('lb.unpublished')); await refreshStatus(); await loadMatch(S.matchId); });
      }
      if (act === 'discard' || act === 'delete') {
        if (!(await confirmDialog(t(act === 'discard' ? 'lb.confirmDiscard' : 'lb.confirmDeleteLineup'), { danger: true }))) return;
        return await withBusy(btn, async () => {
          await adminDelete('lineups', act === 'discard' ? S.lineupId : S.published.id); toast(t('common.deleted')); await refreshStatus(); setDirty(false); await loadMatch(S.matchId);
        });
      }
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const pre = new URLSearchParams(location.search).get('match');
  if (pre && matches.some((m) => m.id === pre)) { $q('#lb-match').value = pre; await loadMatch(pre); } else drawBar();
}
