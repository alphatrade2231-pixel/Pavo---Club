import { bootAdmin } from './shell.js';
import { mountCrud, thumb, flag } from './crud.js';
import { BUCKETS } from '../supabase.js';
import { t } from '../i18n.js';
import { esc, pick, fmtDate, utcToZonedInputs, zonedToUtcIso } from '../utils.js';

const fields = () => [
  { name: 'title_ar', type: 'text', label: 'an.titleAr' }, { name: 'title_en', type: 'text', label: 'an.titleEn' },
  { name: 'body_ar', type: 'textarea', label: 'an.bodyAr', rows: 8, span: 2 }, { name: 'body_en', type: 'textarea', label: 'an.bodyEn', rows: 8, span: 2 },
  { name: 'cover_path', type: 'image', label: 'an.cover', bucket: BUCKETS.news, folder: 'news', span: 2 },
  { name: 'pub_date', type: 'date', label: 'an.date', required: true }, { name: 'pub_time', type: 'time', label: 'an.time', required: true },
  { name: 'is_published', type: 'checkbox', label: 'admin.isPublished' }
];
bootAdmin({ page: 'news', title: 'admin.nav.news', render: (ctx) => {
  const tz = ctx.settings.timezone || 'UTC';
  return mountCrud(ctx, {
    table: 'news', fields, searchCols: ['title_ar', 'title_en'], order: [{ col: 'published_at', asc: false }],
    toggles: [{ field: 'is_published', on: 'common.published', off: 'common.hidden' }],
    newDefaults: { is_published: false, ...(() => { const z = utcToZonedInputs(new Date().toISOString(), tz); return { pub_date: z.date, pub_time: z.time }; })() },
    toForm: (r) => { const z = utcToZonedInputs(r.published_at, tz); return { ...r, pub_date: z.date, pub_time: z.time }; },
    validate: (v) => (!v.title_ar && !v.title_en ? t('err.name') : null),
    toPayload: (v) => { const { pub_date, pub_time, ...rest } = v; return { ...rest, published_at: zonedToUtcIso(pub_date, pub_time, tz) }; },
    columns: [
      { label: 'an.cover', render: (r) => thumb(BUCKETS.news, r.cover_path) },
      { label: 'an.heading', render: (r) => esc(pick(r, 'title', ctx.lang)) },
      { label: 'an.date', render: (r) => esc(fmtDate(r.published_at, ctx.lang, tz, { day: 'numeric', month: 'short', year: 'numeric' })) },
      { label: 'ap.status', render: (r) => flag(r.is_published, 'common.published', 'common.hidden') }
    ]
  });
} });
