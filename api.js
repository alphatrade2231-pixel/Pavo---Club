// The ONLY place that talks to Supabase tables, RPCs and Storage.
// Every call throws on failure, so a failed query can never look like "no data".
import { sb, BUCKETS } from './supabase.js';
import { t } from './i18n.js';
import { uuid } from './utils.js';

/* ------------------------------ errors ------------------------------------ */
export class ApiError extends Error {
  constructor(error) {
    super(error?.message || 'error');
    this.code = error?.code || '';
    this.details = error?.details || '';
    this.raw = error;
  }
}
function unwrap({ data, error }) { if (error) throw new ApiError(error); return data; }

/** Turn any thrown error into a message for the active language. */
export function friendlyError(e) {
  const msg = String(e?.message || e || '');
  const code = e?.code || '';
  const text = `${msg} ${e?.details || ''}`;
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(text)) return t('err.network');
  if (/too_many_starters/.test(text)) return t('err.tooMany');
  if (/lineup_needs_11_starters/.test(text)) return t('err.need11');
  if (/lineup_needs_one_goalkeeper/.test(text)) return t('err.needGk');
  if (/draft_exists/.test(text)) return t('err.draftExists');
  if (/invalid_timezone/.test(text)) return t('err.tz');
  if (/players_jersey_active_uq/.test(text)) return t('err.jersey');
  if (/matches_scores_match_status/.test(text)) return t('err.badScore');
  if (/lineups_match_id_fkey/.test(text)) return t('err.matchLineup');
  if (code === '23503' || /foreign key/i.test(text)) return t('err.fk');
  if (/_has_name|_has_opponent/.test(text)) return t('err.name');
  if (code === '42501' || /row-level security|permission denied|not_authorized|jwt/i.test(text)) return t('err.forbidden');
  return t('err.unknown', { msg });
}

/* ------------------------------ public reads --------------------------------- */
let settingsCache = null;
export async function getClubSettings(force = false) {
  if (settingsCache && !force) return settingsCache;
  const data = unwrap(await sb.from('club_settings').select('*').eq('id', 1).maybeSingle());
  settingsCache = data || {};     // no row yet = empty settings (admin has not saved anything)
  return settingsCache;
}
export const clearSettingsCache = () => { settingsCache = null; };

const clean = (s) => String(s || '').replace(/[,()%*\\]/g, ' ').trim();

export async function getPlayers({ search = '', position = '', sort = 'order', page = 1, pageSize = 12, limit = null } = {}) {
  let q = sb.from('players')
    .select('id,slug,full_name_ar,full_name_en,jersey_number,position,nationality_ar,nationality_en,player_photo', { count: 'exact' })
    .eq('is_active', true).eq('is_published', true);
  const s = clean(search);
  if (s) q = q.or(`full_name_ar.ilike.%${s}%,full_name_en.ilike.%${s}%`);
  if (position) q = q.eq('position', position);
  if (sort === 'name') q = q.order('full_name_en', { nullsFirst: false }).order('full_name_ar');
  else if (sort === 'number') q = q.order('jersey_number', { nullsFirst: false });
  else q = q.order('display_order').order('jersey_number', { nullsFirst: false });
  q = q.order('id');
  if (limit) q = q.limit(limit); else q = q.range((page - 1) * pageSize, page * pageSize - 1);
  const res = await q;
  if (res.error) throw new ApiError(res.error);
  return { rows: res.data, count: res.count ?? res.data.length };
}

export async function getPlayerBySlug(slug) {
  return unwrap(await sb.from('players').select('*').eq('slug', slug).maybeSingle());
}

const MATCH_SELECT = '*, competition:competitions(id,name_ar,name_en)';
const UPCOMING = ['scheduled', 'live', 'postponed'];
const PAST = ['completed', 'abandoned', 'cancelled'];

export async function getMatches({ scope = 'upcoming', competitionId = '', season = '', page = 1, pageSize = 12, limit = null } = {}) {
  let q = sb.from('matches').select(MATCH_SELECT, { count: 'exact' }).eq('is_published', true);
  q = scope === 'upcoming' ? q.in('status', UPCOMING).order('kickoff_at', { ascending: true })
                           : q.in('status', PAST).order('kickoff_at', { ascending: false });
  if (competitionId) q = q.eq('competition_id', competitionId);
  if (season) q = q.eq('season', season);
  if (limit) q = q.limit(limit); else q = q.range((page - 1) * pageSize, page * pageSize - 1);
  const res = await q;
  if (res.error) throw new ApiError(res.error);
  return { rows: res.data, count: res.count ?? res.data.length };
}
export async function getMatch(id) {
  return unwrap(await sb.from('matches').select(MATCH_SELECT).eq('id', id).maybeSingle());
}
export async function getMatchFilters() {
  const [comps, seasons] = await Promise.all([
    sb.from('competitions').select('id,name_ar,name_en').order('display_order').order('name_en'),
    sb.from('matches').select('season').not('season', 'is', null).order('season', { ascending: false }).limit(500)
  ]);
  return {
    competitions: unwrap(comps),
    seasons: [...new Set(unwrap(seasons).map((r) => r.season).filter(Boolean))]
  };
}

const LINEUP_SELECT = `*, match:matches(${MATCH_SELECT}),
  lineup_players(id,player_id,role,position_label,x_percent,y_percent,is_captain,bench_order,display_order,
    player:players(id,slug,full_name_ar,full_name_en,jersey_number,position,nationality_ar,nationality_en,player_photo,date_of_birth,height_cm,weight_kg,preferred_foot))`;

export async function getPublishedLineupForMatch(matchId) {
  return unwrap(await sb.from('lineups').select(LINEUP_SELECT).eq('match_id', matchId).eq('status', 'published').maybeSingle());
}
export async function listPublishedLineups(limit = 40) {
  const rows = unwrap(await sb.from('lineups').select('id,match_id,formation,match:matches(id,opponent_ar,opponent_en,kickoff_at,status,club_is_home)')
    .eq('status', 'published').limit(200));
  return rows.filter((r) => r.match).sort((a, b) => new Date(b.match.kickoff_at) - new Date(a.match.kickoff_at)).slice(0, limit);
}
/** Rule for the home page / lineup page default: the published lineup of the nearest upcoming
 *  match; otherwise the most recent past match that has one. */
export async function getDefaultPublishedLineup() {
  const list = await listPublishedLineups(200);
  if (!list.length) return null;
  const now = Date.now();
  const upcoming = list.filter((l) => new Date(l.match.kickoff_at).getTime() >= now && ['scheduled', 'live'].includes(l.match.status))
    .sort((a, b) => new Date(a.match.kickoff_at) - new Date(b.match.kickoff_at));
  const chosen = upcoming[0] || list[0];
  return unwrap(await sb.from('lineups').select(LINEUP_SELECT).eq('id', chosen.id).maybeSingle());
}

export async function getNews(limit = 6) {
  return unwrap(await sb.from('news').select('*').eq('is_published', true).lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).limit(limit));
}
export async function getGallery(limit = 12) {
  return unwrap(await sb.from('gallery_items').select('*').eq('is_published', true)
    .order('display_order').order('created_at', { ascending: false }).limit(limit));
}

/* ------------------------------ auth -------------------------------------------- */
export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new ApiError(error);
  return data;
}
export const signOut = () => sb.auth.signOut();
export async function getSession() { return unwrap(await sb.auth.getSession()).session; }
/** Authoritative check: asks the database (is_admin reads the protected user_roles table). */
export async function checkIsAdmin() {
  const { data, error } = await sb.rpc('is_admin');
  if (error) throw new ApiError(error);
  return data === true;
}

/* ------------------------------ admin CRUD ----------------------------------------- */
export async function adminList(table, { select = '*', order = [], search = null, filters = [], page = 1, pageSize = 20 } = {}) {
  let q = sb.from(table).select(select, { count: 'exact' });
  for (const [col, op, val] of filters) q = q.filter(col, op, val);
  if (search && search.cols?.length && clean(search.text)) {
    const s = clean(search.text);
    q = q.or(search.cols.map((c) => `${c}.ilike.%${s}%`).join(','));
  }
  for (const o of order) q = q.order(o.col, { ascending: o.asc !== false, nullsFirst: false });
  q = q.range((page - 1) * pageSize, page * pageSize - 1);
  const res = await q;
  if (res.error) throw new ApiError(res.error);
  return { rows: res.data, count: res.count ?? res.data.length };
}
export async function adminAll(table, { select = '*', order = [], filters = [] } = {}) {
  let q = sb.from(table).select(select);
  for (const [col, op, val] of filters) q = q.filter(col, op, val);
  for (const o of order) q = q.order(o.col, { ascending: o.asc !== false, nullsFirst: false });
  return unwrap(await q.limit(1000));
}
export async function adminGet(table, id, select = '*') {
  return unwrap(await sb.from(table).select(select).eq('id', id).maybeSingle());
}
export async function adminSave(table, id, payload) {
  if (id) return unwrap(await sb.from(table).update(payload).eq('id', id).select().single());
  return unwrap(await sb.from(table).insert(payload).select().single());
}
export async function adminDelete(table, id) {
  const data = unwrap(await sb.from(table).delete().eq('id', id).select('id'));
  if (!data || !data.length) throw new ApiError({ message: 'not_authorized', code: '42501' }); // RLS removed 0 rows
}
export async function saveClubSettings(patch) {
  clearSettingsCache();
  return unwrap(await sb.from('club_settings').upsert({ id: 1, ...patch }, { onConflict: 'id' }).select().single());
}
export async function countRows(table, filters = []) {
  let q = sb.from(table).select('*', { count: 'exact', head: true });
  for (const [col, op, val] of filters) q = q.filter(col, op, val);
  const res = await q;
  if (res.error) throw new ApiError(res.error);
  return res.count ?? 0;
}
export async function getDashboardCounts() {
  const nowIso = new Date().toISOString();
  const [activePlayers, publishedPlayers, upcoming, completed, drafts, publishedLineups] = await Promise.all([
    countRows('players', [['is_active', 'eq', true]]),
    countRows('players', [['is_published', 'eq', true]]),
    countRows('matches', [['status', 'in', '(scheduled,live,postponed)']]),
    countRows('matches', [['status', 'eq', 'completed']]),
    countRows('lineups', [['status', 'eq', 'draft']]),
    countRows('lineups', [['status', 'eq', 'published']])
  ]);
  return { activePlayers, publishedPlayers, upcoming, completed, drafts, publishedLineups, nowIso };
}

/* ------------------------------ lineups (admin) ---------------------------------------- */
const ADMIN_LINEUP_SELECT = '*, lineup_players(id,player_id,role,position_label,x_percent,y_percent,is_captain,bench_order,display_order)';
export async function getAdminLineupsForMatch(matchId) {
  const rows = unwrap(await sb.from('lineups').select(ADMIN_LINEUP_SELECT).eq('match_id', matchId));
  return { draft: rows.find((r) => r.status === 'draft') || null, published: rows.find((r) => r.status === 'published') || null };
}
export async function listLineupStatusByMatch() {
  const rows = unwrap(await sb.from('lineups').select('match_id,status').limit(1000));
  const map = {}; for (const r of rows) (map[r.match_id] ||= {})[r.status] = true;
  return map;
}
export async function saveLineupDraft(matchId, data) {
  return unwrap(await sb.rpc('save_lineup_draft', { p_match_id: matchId, p_data: data }));
}
export async function publishLineup(id) { unwrap(await sb.rpc('publish_lineup', { p_lineup_id: id })); }
export async function unpublishLineup(id) { unwrap(await sb.rpc('unpublish_lineup', { p_lineup_id: id })); }
export const deleteLineup = (id) => adminDelete('lineups', id);

/* ------------------------------ images ------------------------------------------------------ */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_MB = 5;

export function validateImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error(t('err.fileType'));
  if (file.size > 20 * 1024 * 1024) throw new Error(t('err.fileSize', { mb: 20 }));
}

/** Shrink big photos in the browser (max side 1600px) and re-encode; keeps PNG logos as PNG. */
async function prepareImage(file, maxSide = 1600) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const keepAlpha = file.type === 'image/png';
    if (scale === 1 && file.size <= MAX_UPLOAD_MB * 1024 * 1024) { bmp.close?.(); return { blob: file, type: file.type }; }
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close?.();
    const type = keepAlpha ? 'image/png' : 'image/webp';
    const blob = await new Promise((res) => c.toBlob(res, type, 0.86));
    if (!blob) return { blob: file, type: file.type };
    return { blob, type };
  } catch { return { blob: file, type: file.type }; }
}
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Upload to Storage and return the object path to save in the database row. */
export async function uploadImage(bucket, folder, file) {
  validateImage(file);
  const { blob, type } = await prepareImage(file);
  if (blob.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(t('err.fileSize', { mb: MAX_UPLOAD_MB }));
  const path = `${folder}/${uuid()}.${EXT[type] || 'jpg'}`;
  const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(t('err.upload', { msg: error.message }));
  return path;
}
/** Best-effort removal of an old/unused file (never blocks the user's action). */
export async function removeImage(bucket, path) {
  if (!path) return;
  try { await sb.storage.from(bucket).remove([path]); } catch (e) { console.warn('Could not remove old image', path, e); }
}

export { BUCKETS };
