import { boot, setMeta } from '../app.js';
import { getPlayerBySlug, friendlyError } from '../api.js';
import { t, posLabel } from '../i18n.js';
import { esc, pick, fmtDay, ageFrom, loadingHtml, errorHtml, emptyHtml } from '../utils.js';
import { playerPhotoHtml, playerName, bindRetry, clubName } from '../ui.js';

let player;
async function render({ settings: s, main, lang }) {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { main.innerHTML = `<div class="wrap page">${emptyHtml(t('err.notFound'))}</div>`; return; }
  if (!player) {
    main.innerHTML = `<div class="wrap page">${loadingHtml()}</div>`;
    try { player = await getPlayerBySlug(slug); }
    catch (e) { main.innerHTML = `<div class="wrap page">${errorHtml(friendlyError(e), t('common.retry'))}</div>`; bindRetry(main, () => render({ settings: s, main, lang })); return; }
  }
  if (!player) { main.innerHTML = `<div class="wrap page">${emptyHtml(t('err.notFound'))}<p><a class="btn" href="players.html">${esc(t('nav.players'))}</a></p></div>`; return; }
  const p = player, name = playerName(p, lang);
  setMeta(`${name} | ${clubName(s, lang)}`, `${name} ${posLabel(p.position)}`.trim());
  const nat = pick(p, 'nationality', lang), bio = pick(p, 'biography', lang), age = ageFrom(p.date_of_birth);
  const facts = [
    [t('player.number'), p.jersey_number], [t('players.position'), posLabel(p.position)], [t('player.nationality'), nat],
    [t('player.dob'), p.date_of_birth ? `${fmtDay(p.date_of_birth, lang)}${age != null ? ` (${age} ${t('common.years')})` : ''}` : ''],
    [t('player.height'), p.height_cm ? `${p.height_cm} ${t('common.cm')}` : ''], [t('player.weight'), p.weight_kg ? `${p.weight_kg} ${t('common.kg')}` : ''],
    [t('player.foot'), p.preferred_foot ? t(`foot.${p.preferred_foot}`) : '']
  ].filter(([, v]) => v !== '' && v != null);
  main.innerHTML = `<div class="wrap page"><p><a class="back" href="players.html">${esc(t('nav.players'))}</a></p>
    <article class="pprofile"><div class="pp-photo">${playerPhotoHtml(p, lang, 'photo')}${p.jersey_number != null ? `<span class="pp-num">${esc(p.jersey_number)}</span>` : ''}</div>
      <div><h1>${esc(name)}</h1><p class="pp-pos">${esc(posLabel(p.position))}</p>
      ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${bio ? `<h2>${esc(t('player.bio'))}</h2><p class="prose">${esc(bio).replace(/\n/g, '<br>')}</p>` : ''}</div></article></div>`;
}
boot({ page: 'players', render });
