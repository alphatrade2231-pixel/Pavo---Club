import { bootAdmin } from './shell.js';
import { mountCrud, thumb, flag } from './crud.js';
import { BUCKETS } from '../supabase.js';
import { t, POSITIONS, posLabel } from '../i18n.js';
import { esc, pick } from '../utils.js';

const fields = () => [
  { name: 'full_name_ar', type: 'text', label: 'ap.nameAr', maxlength: 120 }, { name: 'full_name_en', type: 'text', label: 'ap.nameEn', maxlength: 120 },
  { name: 'jersey_number', type: 'number', label: 'ap.jersey', min: 0, max: 99, step: 1 },
  { name: 'position', type: 'select', label: 'ap.position', options: [{ value: '', label: t('ap.unselected') }, ...POSITIONS.map((p) => ({ value: p, label: `${posLabel(p)} (${p})` }))] },
  { name: 'nationality_ar', type: 'text', label: 'ap.natAr' }, { name: 'nationality_en', type: 'text', label: 'ap.natEn' },
  { name: 'date_of_birth', type: 'date', label: 'ap.dob' },
  { name: 'preferred_foot', type: 'select', label: 'ap.foot', options: [{ value: '', label: t('ap.unselected') }, ...['right', 'left', 'both'].map((v) => ({ value: v, label: t(`foot.${v}`) }))] },
  { name: 'height_cm', type: 'number', label: 'ap.height', min: 100, max: 250, step: 1 }, { name: 'weight_kg', type: 'number', label: 'ap.weight', min: 30, max: 200, step: 1 },
  { name: 'player_photo', type: 'image', label: 'ap.photo', bucket: BUCKETS.players, folder: 'players', span: 2 },
  { name: 'biography_ar', type: 'textarea', label: 'ap.bioAr', span: 2 }, { name: 'biography_en', type: 'textarea', label: 'ap.bioEn', span: 2 },
  { name: 'display_order', type: 'number', label: 'admin.order', step: 1, required: true },
  { name: 'is_active', type: 'checkbox', label: 'admin.isActive' }, { name: 'is_published', type: 'checkbox', label: 'admin.isPublished' }
];
bootAdmin({ page: 'players', title: 'admin.nav.players', render: (ctx) => mountCrud(ctx, {
  table: 'players', fields, searchCols: ['full_name_ar', 'full_name_en'], deleteHint: 'ap.deleteHint',
  order: [{ col: 'display_order' }, { col: 'jersey_number' }, { col: 'created_at', asc: false }],
  newDefaults: { is_active: true, is_published: false, display_order: 0 },
  validate: (v) => (!v.full_name_ar && !v.full_name_en ? t('err.name') : null),
  toggles: [{ field: 'is_published', on: 'common.published', off: 'common.hidden' }, { field: 'is_active', on: 'common.active', off: 'common.inactive' }],
  columns: [
    { label: 'ap.photo', render: (r) => thumb(BUCKETS.players, r.player_photo) },
    { label: 'ap.jersey', render: (r) => esc(r.jersey_number ?? '–') },
    { label: 'ap.name', render: (r) => esc(pick(r, 'full_name', ctx.lang)) },
    { label: 'ap.position', render: (r) => esc(posLabel(r.position)) },
    { label: 'ap.status', render: (r) => `${flag(r.is_active, 'common.active', 'common.inactive')} ${flag(r.is_published, 'common.published', 'common.hidden')}` }
  ]
}) });
