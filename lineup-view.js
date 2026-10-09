// Football pitch (SVG) + lineup rendering shared by the public site, the admin builder and the preview.
import { imageUrl, BUCKETS } from './supabase.js';
import { t, posLabel } from './i18n.js';
import { esc, pick, initials, fmtDate, fmtTime } from './utils.js';
import { playerName, teamsOf, clubName, statusBadge } from './ui.js';

/* Formations: rows listed from the goalkeeper forward. Pitch orientation (fixed everywhere):
   PAVO CLUB's goal is at the BOTTOM (y = 100), the attack goes UP (y = 0). x = 0 is the viewer's left. */
export const FORMATIONS = {
  '4-3-3':   [['GK'], ['LB','CB','CB','RB'], ['CM','CM','CM'], ['LW','ST','RW']],
  '4-2-3-1': [['GK'], ['LB','CB','CB','RB'], ['CDM','CDM'], ['LW','CAM','RW'], ['ST']],
  '4-4-2':   [['GK'], ['LB','CB','CB','RB'], ['LM','CM','CM','RM'], ['ST','ST']],
  '3-5-2':   [['GK'], ['CB','CB','CB'], ['LWB','CM','CDM','CM','RWB'], ['ST','ST']],
  '3-4-3':   [['GK'], ['CB','CB','CB'], ['LM','CM','CM','RM'], ['LW','ST','RW']],
  '4-1-4-1': [['GK'], ['LB','CB','CB','RB'], ['CDM'], ['LM','CM','CM','RM'], ['ST']],
  '5-3-2':   [['GK'], ['LWB','CB','CB','CB','RWB'], ['CM','CM','CM'], ['ST','ST']]
};
const spread = (n) => {
  if (n === 1) return [50];
  const m = n >= 5 ? 10 : n === 4 ? 14 : n === 3 ? 24 : 36;
  return Array.from({ length: n }, (_, i) => +(m + (i * (100 - 2 * m)) / (n - 1)).toFixed(1));
};
/** -> [{label,x,y}] (11 slots) or null for a custom layout */
export function formationSlots(name) {
  const rows = FORMATIONS[name]; if (!rows) return null;
  const out = []; const field = rows.length - 1;
  rows.forEach((labels, r) => {
    const y = r === 0 ? 91 : +(74 - ((r - 1) * 58) / Math.max(1, field - 1)).toFixed(1);
    spread(labels.length).forEach((x, i) => out.push({ label: labels[i], x, y }));
  });
  return out;
}

/* A real 68 x 105 m pitch (IFAB proportions). Everything is vector, nothing is a picture. */
export function pitchHtml(inner = '', extraClass = '') {
  const L = 'fill="none" stroke="var(--pitch-line)" stroke-width=".32"';
  return `<div class="pitch ${extraClass}" dir="ltr"><svg class="pitch-svg" viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <g>${Array.from({ length: 10 }, (_, i) => `<rect x="0" y="${i * 10.5}" width="68" height="10.5" class="band band-${i % 2}"/>`).join('')}</g>
    <g ${L}>
      <rect x="2" y="2" width="64" height="101"/>
      <line x1="2" y1="52.5" x2="66" y2="52.5"/>
      <circle cx="34" cy="52.5" r="9.15"/>
      <rect x="13.84" y="2" width="40.32" height="16.5"/><rect x="24.84" y="2" width="18.32" height="5.5"/>
      <rect x="13.84" y="86.5" width="40.32" height="16.5"/><rect x="24.84" y="97.5" width="18.32" height="5.5"/>
      <path d="M26.69 18.5 A9.15 9.15 0 0 0 41.31 18.5"/><path d="M26.69 86.5 A9.15 9.15 0 0 1 41.31 86.5"/>
      <rect x="30.34" y=".4" width="7.32" height="1.6"/><rect x="30.34" y="103" width="7.32" height="1.6"/>
      <path d="M2 3 A1 1 0 0 0 3 2"/><path d="M65 2 A1 1 0 0 0 66 3"/><path d="M2 102 A1 1 0 0 1 3 103"/><path d="M66 102 A1 1 0 0 0 65 103"/>
    </g>
    <g fill="var(--pitch-line)"><circle cx="34" cy="52.5" r=".45"/><circle cx="34" cy="13" r=".4"/><circle cx="34" cy="92" r=".4"/></g>
  </svg>${inner}</div>`;
}

export function markerHtml(p, lang, { x, y, captain = false, label = '', tag = 'button', attrs = '', cls = '' } = {}) {
  const name = playerName(p, lang);
  const url = imageUrl(BUCKETS.players, p?.player_photo);
  const face = url ? `<img src="${esc(url)}" alt="" loading="lazy" draggable="false">` : `<span>${esc(initials(name))}</span>`;
  return `<${tag} class="pm ${cls}" style="left:${+x}%;top:${+y}%" ${tag === 'button' ? 'type="button"' : ''} aria-label="${esc(name)}${p?.jersey_number != null ? ' ' + esc(p.jersey_number) : ''}" ${attrs}>
    <span class="pm-face">${face}${p?.jersey_number != null ? `<b class="pm-num">${esc(p.jersey_number)}</b>` : ''}${captain ? `<b class="pm-cap" title="${esc(t('player.captain'))}">C</b>` : ''}</span>
    <span class="pm-name">${esc(shortName(name))}</span>${label ? `<span class="pm-pos">${esc(label)}</span>` : ''}</${tag}>`;
}
const shortName = (n) => { const p = String(n).trim().split(/\s+/); return p.length > 2 ? `${p[0]} ${p[p.length - 1]}` : n; };

/** Full public lineup block (also used by the admin preview). lineup.match must be loaded. */
export function lineupViewHtml(lineup, settings, lang) {
  const tz = settings.timezone || 'UTC';
  const m = lineup.match;
  const rows = lineup.lineup_players || [];
  const starters = rows.filter((r) => r.role === 'starter' && r.player).sort((a, b) => a.display_order - b.display_order);
  const bench = rows.filter((r) => r.role === 'bench' && r.player).sort((a, b) => a.bench_order - b.bench_order);
  const markers = starters.map((r) => markerHtml(r.player, lang, {
    x: r.x_percent, y: r.y_percent, captain: r.is_captain, attrs: `data-player="${esc(r.player_id)}"`
  })).join('');
  const { home, away } = m ? teamsOf(m, settings, lang) : {};
  const opp = m ? (m.club_is_home ? away : home) : null;
  const coach = pick(lineup, 'coach_name', lang);
  const notes = pick(lineup, 'notes', lang);
  const formation = lineup.formation === 'custom' ? t('lineup.custom') : lineup.formation;
  const li = (r) => `<li><button type="button" class="lrow" data-player="${esc(r.player_id)}"><b>${r.player.jersey_number != null ? esc(r.player.jersey_number) : '–'}</b>
      <span>${esc(playerName(r.player, lang))}${r.is_captain ? ` <em>(${esc(t('player.captain'))})</em>` : ''}</span><small>${esc(posLabel(r.position_label || r.player.position))}</small></button></li>`;
  return `<section class="lineup" data-lineup="${esc(lineup.id)}">
    <header class="lineup-head">
      ${m ? `<div><p class="lineup-vs">${esc(clubName(settings, lang))} <span>${esc(t('match.vs'))}</span> ${esc(opp.name)}</p>
        <p class="lineup-when"><time datetime="${esc(m.kickoff_at)}">${esc(fmtDate(m.kickoff_at, lang, tz))} ${esc(fmtTime(m.kickoff_at, lang, tz))}</time>
          ${m.competition ? ` ${esc(pick(m.competition, 'name', lang))}` : ''}</p></div>${statusBadge(m.status)}` : ''}
    </header>
    <dl class="lineup-facts"><div><dt>${esc(t('lineup.formation'))}</dt><dd dir="ltr">${esc(formation)}</dd></div>
      ${coach ? `<div><dt>${esc(t('lineup.coach'))}</dt><dd>${esc(coach)}</dd></div>` : ''}</dl>
    <div class="lineup-grid">
      <div class="pitch-wrap">${pitchHtml(markers)}</div>
      <div class="lineup-side">
        <h3>${esc(t('lineup.starters'))}</h3><ol class="lrows">${starters.map(li).join('')}</ol>
        ${bench.length ? `<h3>${esc(t('lineup.bench'))}</h3><ol class="lrows">${bench.map(li).join('')}</ol>` : ''}
        ${notes ? `<h3>${esc(t('lineup.notes'))}</h3><p class="lineup-notes">${esc(notes)}</p>` : ''}
      </div></div></section>`;
}

/* Player card dialog (opened by clicking a player on the pitch or in the lists). */
let dlg;
export function bindLineupView(root, lineup, lang) {
  const byId = new Map((lineup.lineup_players || []).map((r) => [r.player_id, r]));
  root.querySelectorAll('[data-player]').forEach((el) => el.addEventListener('click', () => {
    const r = byId.get(el.dataset.player); if (r?.player) openPlayerDialog(r, lang);
  }));
}
export function openPlayerDialog(row, lang) {
  const p = row.player;
  if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'pdialog'; document.body.append(dlg); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); }
  const url = imageUrl(BUCKETS.players, p.player_photo);
  const nat = pick(p, 'nationality', lang);
  dlg.innerHTML = `<form method="dialog"><button class="dlg-x" aria-label="${esc(t('common.close'))}">×</button></form>
    <div class="pd-top">${url ? `<img src="${esc(url)}" alt="${esc(playerName(p, lang))}">` : `<span class="pd-fallback">${esc(initials(playerName(p, lang)))}</span>`}
      <div><h3>${esc(playerName(p, lang))}</h3>
        <p>${p.jersey_number != null ? `#${esc(p.jersey_number)} ` : ''}${esc(posLabel(row.position_label || p.position))}${row.is_captain ? ` ${esc(t('player.captain'))}` : ''}</p>
        ${nat ? `<p>${esc(nat)}</p>` : ''}</div></div>
    <a class="btn btn-primary" href="player.html?slug=${encodeURIComponent(p.slug)}">${esc(t('common.readMore'))}</a>`;
  dlg.showModal();
}
