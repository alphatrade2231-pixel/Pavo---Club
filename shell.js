// Admin shell: session + role check, sidebar, top bar, language switch, page boot.
import { isConfigured } from '../config.js';
import { sb } from '../supabase.js';
import { getSession, checkIsAdmin, getClubSettings, signOut, friendlyError } from '../api.js';
import { t, initLang, getLang, toggleLang, onLangChange } from '../i18n.js';
import { $, esc, errorHtml, loadingHtml } from '../utils.js';
import { isDirty, setDirty, confirmDialog } from './ui.js';

const NAV = [['dashboard', 'admin.nav.dashboard'], ['club', 'admin.nav.club'], ['players', 'admin.nav.players'], ['competitions', 'admin.nav.competitions'],
  ['matches', 'admin.nav.matches'], ['lineups', 'admin.nav.lineups'], ['news', 'admin.nav.news'], ['gallery', 'admin.nav.gallery'], ['settings', 'admin.nav.settings']];

export const loginUrl = 'index.html';

function chrome(page, titleKey, settings) {
  const name = settings.name_en || settings.name_ar || 'PAVO CLUB';
  $('#admin-root').innerHTML = `
    <div class="admin-layout">
      <aside class="sidebar" id="sidebar"><div class="side-brand">${esc(name)}<small>${esc(t('admin.title'))}</small></div>
        <nav>${NAV.map(([id, k]) => `<a href="${id}.html" ${id === page ? 'aria-current="page"' : ''}>${esc(t(k))}</a>`).join('')}</nav></aside>
      <div class="admin-main">
        <header class="topbar"><button class="menu-btn" id="side-toggle" type="button" aria-label="${esc(t('nav.menu'))}"><span></span><span></span><span></span></button>
          <h1>${esc(t(titleKey))}</h1><span id="dirty-flag" class="dirty-flag" hidden>${esc(t('common.unsaved'))}</span>
          <a class="btn btn-sm" href="../index.html" target="_blank" rel="noopener">${esc(t('admin.viewSite'))}</a>
          <button class="btn btn-sm" id="lang-btn" type="button">${esc(t('lang.switch'))}</button>
          <button class="btn btn-sm" id="logout-btn" type="button">${esc(t('admin.logout'))}</button></header>
        <main id="app" class="admin-content" tabindex="-1"></main></div></div>`;
  $('#side-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#lang-btn').addEventListener('click', async () => {
    if (isDirty() && !(await confirmDialog(t('admin.leave')))) return;
    setDirty(false); toggleLang();
  });
  $('#logout-btn').addEventListener('click', async () => {
    if (isDirty() && !(await confirmDialog(t('admin.leave')))) return;
    setDirty(false); await signOut(); location.href = loginUrl;
  });
  document.addEventListener('dirtychange', (e) => { const f = $('#dirty-flag'); if (f) f.hidden = !e.detail; });
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('.sidebar a'); if (!a || !isDirty()) return;
    e.preventDefault(); if (await confirmDialog(t('admin.leave'))) { setDirty(false); location.href = a.href; }
  });
}

export async function bootAdmin({ page, title, render }) {
  const root = $('#admin-root');
  initLang('ar');
  if (!isConfigured()) { root.innerHTML = `<div class="admin-center">${errorHtml(t('err.config'), t('common.retry'))}</div>`; $('[data-retry]').onclick = () => location.reload(); return; }
  root.innerHTML = `<div class="admin-center">${loadingHtml()}<p>${esc(t('admin.checking'))}</p></div>`;
  try {
    const session = await getSession();
    if (!session) { location.replace(loginUrl); return; }
    if (!(await checkIsAdmin())) { await signOut(); location.replace(`${loginUrl}?denied=1`); return; }
  } catch (e) {
    root.innerHTML = `<div class="admin-center">${errorHtml(friendlyError(e), t('common.retry'))}</div>`; $('[data-retry]').onclick = () => location.reload(); return;
  }
  sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') location.replace(loginUrl); });
  let settings = {};
  try { settings = await getClubSettings(true); } catch { /* the page shows its own error if it needs settings */ }
  initLang(settings.default_lang);
  document.title = `${t(title)} | ${t('admin.title')}`;
  chrome(page, title, settings);
  const ctx = { settings, get main() { return $('#app'); }, get lang() { return getLang(); }, refreshSettings: async () => { settings = await getClubSettings(true); ctx.settings = settings; return settings; } };
  ctx.settings = settings;
  const run = () => render(ctx);
  await run();
  onLangChange(() => { document.title = `${t(title)} | ${t('admin.title')}`; chrome(page, title, ctx.settings); run(); });
}
