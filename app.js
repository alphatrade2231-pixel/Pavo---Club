// Public-site shell: loads club settings, applies theme + language, builds header/footer, runs the page.
import { isConfigured } from './config.js';
import { getClubSettings, friendlyError } from './api.js';
import { imageUrl, BUCKETS } from './supabase.js';
import { t, initLang, getLang, toggleLang, onLangChange, applyI18n } from './i18n.js';
import { $, esc, safeUrl, pick, errorHtml, loadingHtml } from './utils.js';
import { clubName, logoHtml, bindRetry } from './ui.js';

const HEX = /^#[0-9A-Fa-f]{6}$/;

function applyTheme(s) {
  const root = document.documentElement.style;
  for (const [col, v] of [['color_primary', '--primary'], ['color_accent', '--accent'], ['color_pitch', '--pitch']]) {
    if (HEX.test(s[col] || '')) root.setProperty(v, s[col]); else root.removeProperty(v);
  }
}

/** Page <title> + meta description from real club data only. */
export function setMeta(title, description) {
  if (title) document.title = title;
  if (description) {
    for (const sel of ['meta[name="description"]', 'meta[property="og:description"]']) $(sel)?.setAttribute('content', description);
  }
  if (title) $('meta[property="og:title"]')?.setAttribute('content', title);
}

function navItems(s) {
  const items = [['index.html', 'nav.home', 'home']];
  if (s.show_players !== false) items.push(['players.html', 'nav.players', 'players']);
  if (s.show_matches !== false) items.push(['matches.html', 'nav.matches', 'matches']);
  if (s.show_lineup !== false) items.push(['lineup.html', 'nav.lineup', 'lineup']);
  if (s.show_news) items.push(['index.html#news', 'nav.news', 'news']);
  if (s.show_gallery) items.push(['index.html#gallery', 'nav.gallery', 'gallery']);
  return items;
}

function buildChrome(s, page) {
  const lang = getLang();
  const name = clubName(s, lang);
  const logo = imageUrl(BUCKETS.club, s.logo_path);
  const links = navItems(s).map(([href, key, id]) =>
    `<a href="${href}" ${id === page ? 'aria-current="page"' : ''}>${esc(t(key))}</a>`).join('');
  $('#site-header').innerHTML = `
    <a class="skip" href="#app">${esc(t('nav.skip'))}</a>
    <header class="site-header"><div class="wrap bar">
      <a class="brand" href="index.html" aria-label="${esc(name)}">${logo ? logoHtml(logo, name, 'brand-logo') : ''}<span class="brand-name">${esc(name)}</span></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${esc(t('nav.menu'))}"><span></span><span></span><span></span></button>
      <nav id="site-nav" class="nav" aria-label="${esc(t('nav.menu'))}">${links}</nav>
      <button class="lang-btn" type="button" aria-label="${esc(t('lang.switchLabel'))}">${esc(t('lang.switch'))}</button>
    </div></header>`;
  const btn = $('.menu-btn'), nav = $('#site-nav');
  btn.addEventListener('click', () => { const open = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open)); });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  $('.lang-btn').addEventListener('click', toggleLang);

  const social = Object.entries(s.social_links || {}).filter(([, u]) => safeUrl(u))
    .map(([k, u]) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener noreferrer">${esc(t(`social.${k}`) === `social.${k}` ? k : t(`social.${k}`))}</a>`).join('');
  const address = pick(s, 'address', lang);
  $('#site-footer').innerHTML = `
    <footer class="site-footer"><div class="wrap foot-grid">
      <div><p class="foot-name">${esc(name)}</p>${pick(s, 'slogan', lang) ? `<p class="foot-slogan">${esc(pick(s, 'slogan', lang))}</p>` : ''}</div>
      <div><h2>${esc(t('footer.links'))}</h2><nav class="foot-links">${links}</nav></div>
      ${(s.email || s.phone || address) ? `<div><h2>${esc(t('info.contact'))}</h2><address>
        ${s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''}
        ${s.phone ? `<a href="tel:${esc(String(s.phone).replace(/[^\d+]/g, ''))}" dir="ltr">${esc(s.phone)}</a>` : ''}
        ${address ? `<span>${esc(address)}</span>` : ''}</address></div>` : ''}
      ${social ? `<div><h2>${esc(t('footer.follow'))}</h2><div class="foot-links">${social}</div></div>` : ''}
    </div>
    <div class="wrap foot-copy"><small>© ${new Date().getFullYear()} ${esc(name)}. ${esc(t('footer.rights'))}</small></div></footer>`;
}

export async function boot({ page, render }) {
  const main = $('#app');
  const minimalChrome = () => {
    $('#site-header').innerHTML = `<header class="site-header"><div class="wrap bar"><a class="brand" href="index.html"><span class="brand-name">PAVO CLUB</span></a>
      <button class="lang-btn" type="button">${esc(t('lang.switch'))}</button></div></header>`;
    $('.lang-btn').addEventListener('click', () => { toggleLang(); location.reload(); });
  };
  if (!isConfigured()) {
    initLang('ar'); minimalChrome();
    main.innerHTML = `<div class="wrap">${errorHtml(t('err.config'), t('common.retry'))}</div>`;
    bindRetry(main, () => location.reload());
    return;
  }
  main.innerHTML = loadingHtml();
  let settings;
  try { settings = await getClubSettings(); }
  catch (e) {
    initLang('ar'); minimalChrome();
    main.innerHTML = `<div class="wrap">${errorHtml(friendlyError(e), t('common.retry'))}</div>`;
    bindRetry(main, () => location.reload());
    return;
  }
  initLang(settings.default_lang);
  applyTheme(settings);
  buildChrome(settings, page);
  const ctx = { settings, main, get lang() { return getLang(); } };
  const run = () => render(ctx);
  await run();
  onLangChange(() => { buildChrome(settings, page); applyI18n(); run(); });
}
