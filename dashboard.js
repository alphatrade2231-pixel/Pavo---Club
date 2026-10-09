import { bootAdmin } from './shell.js';
import { getDashboardCounts, friendlyError } from '../api.js';
import { t } from '../i18n.js';
import { esc, loadingHtml, errorHtml } from '../utils.js';

bootAdmin({ page: 'dashboard', title: 'admin.nav.dashboard', render: async ({ main }) => {
  main.innerHTML = loadingHtml();
  try {
    const c = await getDashboardCounts();
    const cards = [['dash.activePlayers', c.activePlayers], ['dash.publishedPlayers', c.publishedPlayers], ['dash.upcoming', c.upcoming],
      ['dash.completed', c.completed], ['dash.drafts', c.drafts], ['dash.publishedLineups', c.publishedLineups]];
    main.innerHTML = `<div class="stat-grid">${cards.map(([k, v]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(t(k))}</span></div>`).join('')}</div>
      <div class="card"><h2>${esc(t('dash.setup'))}</h2><p>${esc(t('dash.setupHint'))}</p></div>`;
  } catch (e) { main.innerHTML = errorHtml(friendlyError(e), t('common.retry')); main.querySelector('[data-retry]').onclick = () => location.reload(); }
} });
