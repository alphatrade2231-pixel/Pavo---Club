// Small, dependency-free helpers shared by every page.

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
/** Escape untrusted text before it is placed in an HTML string. */
export const esc = (v) => String(v ?? '').replace(/[&<>"'`]/g, (c) => ESC[c]);

/** Allow only http(s)/mailto/tel links coming from the database. */
export function safeUrl(u) {
  const s = String(u ?? '').trim();
  return /^(https?:\/\/|mailto:|tel:)/i.test(s) ? s : '';
}

export const debounce = (fn, ms = 300) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }));

/** Pick the field in the active language, falling back to the other one. */
export function pick(row, base, lang) {
  if (!row) return '';
  const other = lang === 'ar' ? 'en' : 'ar';
  return (row[`${base}_${lang}`] || row[`${base}_${other}`] || '').toString().trim();
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/* --------------------------- time zones -------------------------------- */
const localeFor = (lang) => (lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB');

function partsIn(ts, tz) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const o = {}; for (const p of f.formatToParts(new Date(ts))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute, s: +o.second };
}
function offsetMs(ts, tz) {
  const p = partsIn(ts, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000;
}

/** "2026-05-14" + "20:30" typed in the club's zone  ->  UTC ISO string (no double conversion). */
export function zonedToUtcIso(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, mi] = (timeStr || '00:00').split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, mi, 0);
  let utc = wall - offsetMs(wall, tz);
  utc = wall - offsetMs(utc, tz);             // second pass handles DST edges
  return new Date(utc).toISOString();
}
/** UTC timestamp -> {date:'YYYY-MM-DD', time:'HH:MM'} in the club's zone (for the admin form). */
export function utcToZonedInputs(iso, tz) {
  const p = partsIn(new Date(iso).getTime(), tz);
  const z = (n) => String(n).padStart(2, '0');
  return { date: `${p.y}-${z(p.m)}-${z(p.d)}`, time: `${z(p.h)}:${z(p.mi)}` };
}
export const fmtDate = (iso, lang, tz, opts = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) =>
  iso ? new Intl.DateTimeFormat(localeFor(lang), { timeZone: tz, ...opts }).format(new Date(iso)) : '';
export const fmtTime = (iso, lang, tz) =>
  iso ? new Intl.DateTimeFormat(localeFor(lang), { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: lang !== 'ar' ? false : true }).format(new Date(iso)) : '';
export const fmtDay = (isoDate, lang) =>        // plain calendar date (no time zone shift)
  isoDate ? new Intl.DateTimeFormat(localeFor(lang), { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoDate + 'T00:00:00Z')) : '';
export const ageFrom = (isoDate) => {
  if (!isoDate) return null;
  const b = new Date(isoDate + 'T00:00:00Z'), n = new Date();
  let a = n.getUTCFullYear() - b.getUTCFullYear();
  if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) a--;
  return a;
};
export const validTimeZone = (tz) => { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; } };

/* --------------------------- match logic -------------------------------- */
/** 'W' | 'D' | 'L' from PAVO CLUB's side, ONLY for completed matches with both scores. */
export function clubResult(m) {
  if (!m || m.status !== 'completed' || m.home_score == null || m.away_score == null) return null;
  const mine = m.club_is_home ? m.home_score : m.away_score;
  const theirs = m.club_is_home ? m.away_score : m.home_score;
  return mine > theirs ? 'W' : mine < theirs ? 'L' : 'D';
}
export const clubScore = (m) => (m.club_is_home ? m.home_score : m.away_score);
export const opponentScore = (m) => (m.club_is_home ? m.away_score : m.home_score);

/* --------------------------- toasts ---------------------------------------- */
export function toast(message, kind = 'ok') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`; el.textContent = message; box.append(el);
  setTimeout(() => el.remove(), kind === 'error' ? 7000 : 3500);
}

/* ---------------------- loading / error / empty states ------------------------ */
export const loadingHtml = () => `<div class="state state-loading" role="status"><span class="spinner" aria-hidden="true"></span></div>`;
export const emptyHtml = (msg) => `<div class="state state-empty"><p>${esc(msg)}</p></div>`;
export const errorHtml = (msg, retryLabel) =>
  `<div class="state state-error" role="alert"><p>${esc(msg)}</p><button class="btn" type="button" data-retry>${esc(retryLabel)}</button></div>`;
