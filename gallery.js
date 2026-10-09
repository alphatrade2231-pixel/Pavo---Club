import { bootAdmin } from './shell.js';
import { mountCrud, thumb, flag } from './crud.js';
import { BUCKETS } from '../supabase.js';
import { esc, pick } from '../utils.js';

const fields = () => [
  { name: 'image_path', type: 'image', label: 'ag.image', bucket: BUCKETS.gallery, folder: 'gallery', required: true, span: 2 },
  { name: 'caption_ar', type: 'text', label: 'ag.capAr' }, { name: 'caption_en', type: 'text', label: 'ag.capEn' },
  { name: 'display_order', type: 'number', label: 'admin.order', step: 1, required: true }, { name: 'is_published', type: 'checkbox', label: 'admin.isPublished' }
];
bootAdmin({ page: 'gallery', title: 'admin.nav.gallery', render: (ctx) => mountCrud(ctx, {
  table: 'gallery_items', fields, order: [{ col: 'display_order' }, { col: 'created_at', asc: false }], imageRequiredKey: 'ag.imageRequired',
  newDefaults: { is_published: false, display_order: 0 }, toggles: [{ field: 'is_published', on: 'common.published', off: 'common.hidden' }],
  columns: [
    { label: 'ag.image', render: (r) => thumb(BUCKETS.gallery, r.image_path) },
    { label: 'ag.capAr', render: (r) => esc(pick(r, 'caption', ctx.lang) || '–') },
    { label: 'admin.order', render: (r) => esc(r.display_order) },
    { label: 'ap.status', render: (r) => flag(r.is_published, 'common.published', 'common.hidden') }
  ]
}) });
