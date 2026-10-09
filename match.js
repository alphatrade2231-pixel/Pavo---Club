import { boot, setMeta } from '../app.js';
import { getMatch, getPublishedLineupForMatch, friendlyError } from '../api.js';
import { t } from '../i18n.js';
import { esc, pick, fmtDate, fmtTime, loadingHtml, emptyHtml, errorHtml } from '../utils.js';
import { fixtureHtml, teamsOf, bindRetry, clubName } from '../ui.js';
import { lineupViewHtml, bindLineupView } from '../lineup-view.js';

let data;
async function render({ settings: s, main, lang }) {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { main.innerHTML = `<div class="wrap page">${emptyHtml(t('err.notFound'))}</div>`; return; }
  if (!data) {
    main.innerHTML = `<div class="wrap page">${loadingHtml()}</div>`;
    try { const m = await getMatch(id); data = { m, lineup: m ? await getPublishedLineupForMatch(id) : null }; }
    catch (e) { main.innerHTML = `<div class="wrap page">${errorHtml(friendlyError(e), t('common.retry'))}</div>`; bindRetry(main, () => render({ settings: s, main, lang })); return; }
  }
  const { m, lineup } = data;
  if (!m) { main.innerHTML = `<div class="wrap page">${emptyHtml(t('err.notFound'))}<p><a class="btn" href="matches.html">${esc(t('nav.matches'))}</a></p></div>`; return; }
  const { home, away } = teamsOf(m, s, lang), tz = s.timezone || 'UTC';
  setMeta(`${home.name} ${t('match.vs')} ${away.name} | ${clubName(s, lang)}`);
  const report = pick(m, 'match_report', lang), venue = pick(m, 'venue', lang);
  const comp = m.competition ? pick(m.competition, 'name', lang) : '';
  const rows = [[t('match.kickoff'), `${fmtDate(m.kickoff_at, lang, tz)} ${fmtTime(m.kickoff_at, lang, tz)}`], [t('match.venue'), venue],
    [t('matches.competition'), comp], [t('matches.season'), m.season || ''], [t('match.details'), m.club_is_home ? t('match.home') : t('match.away')]].filter(([, v]) => v);
  main.innerHTML = `<div class="wrap page"><p><a class="back" href="matches.html">${esc(t('nav.matches'))}</a></p>
    ${fixtureHtml(m, s, lang, { link: false })}
    <dl class="facts facts-wide">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <p class="note">${esc(t('match.clubTimeNote'))}</p>
    ${report ? `<h2>${esc(t('match.report'))}</h2><div class="prose">${esc(report).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>` : ''}
    ${lineup ? `<h2>${esc(t('match.lineup'))}</h2><div id="lu"></div>` : ''}</div>`;
  if (lineup) { const el = main.querySelector('#lu'); el.innerHTML = lineupViewHtml({ ...lineup, match: m }, s, lang); bindLineupView(el, lineup, lang); }
}
boot({ page: 'matches', render });
