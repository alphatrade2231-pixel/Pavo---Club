import { bootAdmin } from './shell.js';
import { mountSingle } from './single.js';
import { t } from '../i18n.js';
import { validTimeZone } from '../utils.js';

const zones = (() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC', 'Africa/Cairo', 'Asia/Riyadh', 'Europe/London']; } })();
const n = (name, label, min, max) => ({ name, type: 'number', label, min, max, step: 1, required: true });
const fields = [
  { name: 'default_lang', type: 'select', label: 'set.lang', options: [{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }] },
  { name: 'timezone', type: 'text', label: 'set.tz', required: true, hint: 'set.tzHint' },
  { heading: 'set.sections' },
  { name: 'show_players', type: 'checkbox', label: 'set.showPlayers' }, { name: 'show_matches', type: 'checkbox', label: 'set.showMatches' },
  { name: 'show_lineup', type: 'checkbox', label: 'set.showLineup' }, { name: 'show_news', type: 'checkbox', label: 'set.showNews' },
  { name: 'show_gallery', type: 'checkbox', label: 'set.showGallery' },
  { heading: 'set.display' },
  n('home_players_limit', 'set.homePlayers', 1, 24), n('home_matches_limit', 'set.homeMatches', 1, 10),
  n('players_page_size', 'set.playersPage', 4, 48), n('matches_page_size', 'set.matchesPage', 4, 48)
];
bootAdmin({ page: 'settings', title: 'admin.nav.settings', render: (ctx) => {
  mountSingle(ctx, { fields, validate: (v) => (validTimeZone(v.timezone) ? null : t('err.tz')) });
  const input = ctx.main.querySelector('[name=timezone]'); input.setAttribute('list', 'tzlist');
  input.insertAdjacentHTML('afterend', `<datalist id="tzlist">${zones.map((z) => `<option value="${z}">`).join('')}</datalist>`);
} });
