import { boot, setMeta } from '../app.js';
import { getPlayers, getMatches, getDefaultPublishedLineup, getNews, getGallery, friendlyError } from '../api.js';
import { imageUrl, BUCKETS } from '../supabase.js';
import { t } from '../i18n.js';
import { esc, pick, fmtDay, fmtDate, loadingHtml, emptyHtml, errorHtml, safeUrl } from '../utils.js';
import { clubName, logoHtml, playerCardHtml, fixtureHtml, bindRetry } from '../ui.js';
import { lineupViewHtml, bindLineupView } from '../lineup-view.js';

const cache = new Map();           // keeps fetched data so switching language does not refetch
let newsItems = [];

async function load(key, fn, force) {
  if (!force && cache.has(key)) return cache.get(key);
  const v = await fn(); cache.set(key, v); return v;
}

/** Fills one section; a failure shows a retry button for THAT section only. */
async function fill(el, key, loader, draw, lang) {
  el.innerHTML = loadingHtml();
  try { const data = await load(key, loader); el.innerHTML = draw(data); el._after?.(); }
  catch (e) {
    el.innerHTML = errorHtml(friendlyError(e), t('common.retry'));
    bindRetry(el, async () => { cache.delete(key); await fill(el, key, loader, draw, lang); });
  }
}

const sectionShell = (id, title, link) => `<section class="section" id="${id}"><div class="wrap">
  <div class="section-head"><h2>${esc(title)}</h2>${link ? `<a class="more" href="${link}">${esc(t('common.viewAll'))}</a>` : ''}</div><div class="section-body"></div></div></section>`;

function hero(s, lang) {
  const name = clubName(s, lang);
  const other = pick(s, 'name', lang === 'ar' ? 'en' : 'ar');
  const cover = imageUrl(BUCKETS.club, s.cover_path);
  const logo = imageUrl(BUCKETS.club, s.logo_path);
  const slogan = pick(s, 'slogan', lang), desc = pick(s, 'description', lang);
  const short = desc.length > 260 ? desc.slice(0, 257).trimEnd() + '…' : desc;
  const ctas = [];
  if (s.show_players !== false) ctas.push(['players.html', 'home.cta.players']);
  if (s.show_matches !== false) ctas.push(['matches.html', 'home.cta.matches']);
  if (s.show_lineup !== false) ctas.push(['lineup.html', 'home.cta.lineup']);
  return `<section class="hero ${cover ? 'has-cover' : ''}" ${cover ? `style="--cover:url('${esc(cover)}')"` : ''}>
    <div class="hero-eye" aria-hidden="true"></div>
    <div class="wrap hero-in">
      ${logo ? `<div class="hero-logo">${logoHtml(logo, name, 'hero-logo-img')}</div>` : ''}
      <h1>${esc(name)}</h1>
      ${other && other !== name ? `<p class="hero-alt" lang="${lang === 'ar' ? 'en' : 'ar'}">${esc(other)}</p>` : ''}
      ${slogan ? `<p class="hero-slogan">${esc(slogan)}</p>` : ''}
      ${short ? `<p class="hero-desc">${esc(short)}</p>` : ''}
      ${ctas.length ? `<div class="hero-cta">${ctas.map(([h, k], i) => `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}" href="${h}">${esc(t(k))}</a>`).join('')}</div>` : ''}
    </div></section>`;
}

function about(s, lang) {
  const rows = [];
  const founded = s.founded_on ? fmtDay(s.founded_on, lang) : '';
  const stadium = pick(s, 'stadium', lang);
  const loc = [pick(s, 'city', lang), pick(s, 'country', lang)].filter(Boolean).join(lang === 'ar' ? '، ' : ', ');
  if (founded) rows.push([t('info.founded'), founded]);
  if (stadium) rows.push([t('info.stadium'), stadium]);
  if (loc) rows.push([t('info.location'), loc]);
  const desc = pick(s, 'description', lang);
  if (!rows.length && !desc) return '';
  return `<section class="section" id="about"><div class="wrap about">
    <div><h2>${esc(t('home.about'))}</h2>${desc ? `<p class="about-text">${esc(desc)}</p>` : ''}</div>
    ${rows.length ? `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
  </div></section>`;
}

async function render({ settings: s, main, lang }) {
  setMeta(clubName(s, lang), pick(s, 'description', lang).slice(0, 160) || null);
  const parts = [hero(s, lang), about(s, lang)];
  if (s.show_players !== false) parts.push(sectionShell('players', t('home.players'), 'players.html'));
  if (s.show_matches !== false) parts.push(sectionShell('matches', t('home.matches'), 'matches.html'));
  if (s.show_lineup !== false) parts.push(sectionShell('lineup', t('home.lineup'), 'lineup.html'));
  if (s.show_news) parts.push(sectionShell('news', t('home.news')));
  if (s.show_gallery) parts.push(sectionShell('gallery', t('home.gallery')));
  main.innerHTML = parts.join('');
  const body = (id) => main.querySelector(`#${id} .section-body`);
  const jobs = [];

  if (s.show_players !== false) jobs.push(fill(body('players'), 'players',
    () => getPlayers({ limit: s.home_players_limit || 8 }),
    ({ rows }) => rows.length ? `<div class="pgrid">${rows.map((p) => playerCardHtml(p, lang)).join('')}</div>` : emptyHtml(t('empty.players')), lang));

  if (s.show_matches !== false) jobs.push(fill(body('matches'), 'matches', async () => {
    const n = s.home_matches_limit || 3;
    const [up, past] = await Promise.all([getMatches({ scope: 'upcoming', limit: n }), getMatches({ scope: 'past', limit: n })]);
    return { up: up.rows, past: past.rows };
  }, ({ up, past }) => {
    if (!up.length && !past.length) return emptyHtml(t('empty.matches'));
    const list = (title, rows, empty) => `<div><h3 class="sub">${esc(title)}</h3>${rows.length ? `<div class="fx-list">${rows.map((m) => fixtureHtml(m, s, lang)).join('')}</div>` : emptyHtml(empty)}</div>`;
    return `<div class="two-col">${list(t('home.upcoming'), up, t('empty.upcoming'))}${list(t('home.recent'), past, t('empty.past'))}</div>`;
  }, lang));

  if (s.show_lineup !== false) {
    const el = body('lineup');
    jobs.push(fill(el, 'lineup', getDefaultPublishedLineup,
      (l) => { if (!l) return emptyHtml(t('empty.lineup')); el._after = () => bindLineupView(el, l, lang); return lineupViewHtml(l, s, lang); }, lang));
  }

  if (s.show_news) {
    const el = body('news');
    jobs.push(fill(el, 'news', () => getNews(6), (rows) => {
      newsItems = rows;
      if (!rows.length) return emptyHtml(t('empty.news'));
      el._after = () => el.querySelectorAll('[data-news]').forEach((b) => b.addEventListener('click', () => openNews(b.dataset.news, s, lang)));
      return `<div class="ngrid">${rows.map((n) => {
        const img = imageUrl(BUCKETS.news, n.cover_path);
        return `<article class="ncard">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : ''}
          <div><time datetime="${esc(n.published_at)}">${esc(fmtDate(n.published_at, lang, s.timezone || 'UTC', { day: 'numeric', month: 'long', year: 'numeric' }))}</time>
          <h3>${esc(pick(n, 'title', lang))}</h3>
          <button class="more" type="button" data-news="${esc(n.id)}">${esc(t('common.readMore'))}</button></div></article>`;
      }).join('')}</div>`;
    }, lang));
  }

  if (s.show_gallery) {
    const el = body('gallery');
    jobs.push(fill(el, 'gallery', () => getGallery(12), (rows) => rows.length
      ? `<div class="ggrid">${rows.map((g) => { const c = pick(g, 'caption', lang);
          return `<figure><img src="${esc(imageUrl(BUCKETS.gallery, g.image_path))}" alt="${esc(c)}" loading="lazy" decoding="async">${c ? `<figcaption>${esc(c)}</figcaption>` : ''}</figure>`; }).join('')}</div>`
      : emptyHtml(t('empty.gallery')), lang));
  }
  await Promise.all(jobs);
}

let dlg;
function openNews(id, s, lang) {
  const n = newsItems.find((x) => x.id === id); if (!n) return;
  if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'ndialog'; document.body.append(dlg); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); }
  const img = imageUrl(BUCKETS.news, n.cover_path);
  dlg.innerHTML = `<form method="dialog"><button class="dlg-x" aria-label="${esc(t('common.close'))}">×</button></form>
    ${img ? `<img src="${esc(img)}" alt="">` : ''}<h3>${esc(pick(n, 'title', lang))}</h3>
    <time datetime="${esc(n.published_at)}">${esc(fmtDate(n.published_at, lang, s.timezone || 'UTC'))}</time>
    <div class="prose">${esc(pick(n, 'body', lang)).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>`;
  dlg.showModal();
}

boot({ page: 'home', render });
