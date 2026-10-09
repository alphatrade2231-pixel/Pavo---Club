import { boot, setMeta } from '../app.js';
import { getDefaultPublishedLineup, listPublishedLineups, getPublishedLineupForMatch, getMatch, friendlyError } from '../api.js';
import { t } from '../i18n.js';
import { $, esc, pick, fmtDate, loadingHtml, emptyHtml, errorHtml } from '../utils.js';
import { bindRetry, clubName } from '../ui.js';
import { lineupViewHtml, bindLineupView } from '../lineup-view.js';

let list = null; let current = null; let currentId = new URLSearchParams(location.search).get('match') || '';

async function render({ settings: s, main, lang }) {
  setMeta(`${t('lineup.title')} | ${clubName(s, lang)}`);
  main.innerHTML = `<div class="wrap page"><h1>${esc(t('lineup.title'))}</h1><div id="chooser"></div><div id="view">${loadingHtml()}</div></div>`;
  const view = $('#view');
  async function load() {
    view.innerHTML = loadingHtml();
    try {
      list ||= await listPublishedLineups(60);
      if (!current) {
        if (currentId) { const [m, l] = await Promise.all([getMatch(currentId), getPublishedLineupForMatch(currentId)]); current = l && m ? { ...l, match: m } : null; }
        else current = await getDefaultPublishedLineup();
        currentId = current?.match_id || currentId;
      }
      if (!list.length || !current) { view.innerHTML = emptyHtml(t('empty.lineup')); $('#chooser').innerHTML = ''; return; }
      $('#chooser').innerHTML = list.length > 1 ? `<label class="field chooser"><span>${esc(t('lineup.choose'))}</span><select id="pick">
        ${list.map((l) => `<option value="${l.match_id}" ${l.match_id === currentId ? 'selected' : ''}>${esc(pick(l.match, 'opponent', lang))} ${esc(fmtDate(l.match.kickoff_at, lang, s.timezone || 'UTC', { day: 'numeric', month: 'short', year: 'numeric' }))}</option>`).join('')}</select></label>` : '';
      $('#pick')?.addEventListener('change', async (e) => {
        currentId = e.target.value; current = null; history.replaceState(null, '', `?match=${encodeURIComponent(currentId)}`); load();
      });
      view.innerHTML = lineupViewHtml(current, s, lang); bindLineupView(view, current, lang);
    } catch (e) { view.innerHTML = errorHtml(friendlyError(e), t('common.retry')); bindRetry(view, () => { current = null; load(); }); }
  }
  await load();
}
boot({ page: 'lineup', render });
