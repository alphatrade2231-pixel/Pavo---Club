import { bootAdmin } from './shell.js';
import { mountCrud } from './crud.js';
import { t } from '../i18n.js';
import { esc, pick } from '../utils.js';

const fields = () => [
  { name: 'name_ar', type: 'text', label: 'ac.nameAr' }, { name: 'name_en', type: 'text', label: 'ac.nameEn' },
  { name: 'display_order', type: 'number', label: 'admin.order', step: 1, required: true }, { name: 'is_active', type: 'checkbox', label: 'admin.isActive' }
];
bootAdmin({ page: 'competitions', title: 'admin.nav.competitions', render: (ctx) => mountCrud(ctx, {
  table: 'competitions', fields, order: [{ col: 'display_order' }, { col: 'name_en' }], newDefaults: { is_active: true, display_order: 0 },
  validate: (v) => (!v.name_ar && !v.name_en ? t('err.name') : null),
  columns: [{ label: 'ap.name', render: (r) => esc(pick(r, 'name', ctx.lang)) }, { label: 'admin.order', render: (r) => esc(r.display_order) }]
}) });
