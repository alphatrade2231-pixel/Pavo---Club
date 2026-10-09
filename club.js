import { bootAdmin } from './shell.js';
import { mountSingle } from './single.js';
import { BUCKETS } from '../supabase.js';
import { t } from '../i18n.js';

const SOCIAL = ['facebook', 'instagram', 'x', 'youtube', 'tiktok', 'website'];
const fields = [
  { heading: 'club.names' },
  { name: 'name_ar', type: 'text', label: 'club.nameAr', maxlength: 120 }, { name: 'name_en', type: 'text', label: 'club.nameEn', maxlength: 120 },
  { name: 'slogan_ar', type: 'text', label: 'club.sloganAr', maxlength: 160 }, { name: 'slogan_en', type: 'text', label: 'club.sloganEn', maxlength: 160 },
  { name: 'description_ar', type: 'textarea', label: 'club.descAr', span: 2 }, { name: 'description_en', type: 'textarea', label: 'club.descEn', span: 2 },
  { name: 'logo_path', type: 'image', label: 'club.logo', bucket: BUCKETS.club, folder: 'logo' },
  { name: 'cover_path', type: 'image', label: 'club.cover', bucket: BUCKETS.club, folder: 'cover' },
  { name: 'founded_on', type: 'date', label: 'club.founded' }, { name: '_sp1', type: 'text', label: 'club.founded', span: 0 },
  { name: 'stadium_ar', type: 'text', label: 'club.stadiumAr' }, { name: 'stadium_en', type: 'text', label: 'club.stadiumEn' },
  { name: 'city_ar', type: 'text', label: 'club.cityAr' }, { name: 'city_en', type: 'text', label: 'club.cityEn' },
  { name: 'country_ar', type: 'text', label: 'club.countryAr' }, { name: 'country_en', type: 'text', label: 'club.countryEn' },
  { name: 'email', type: 'email', label: 'club.email' }, { name: 'phone', type: 'tel', label: 'club.phone' },
  { name: 'address_ar', type: 'text', label: 'club.addressAr' }, { name: 'address_en', type: 'text', label: 'club.addressEn' },
  { heading: 'club.social' },
  ...SOCIAL.map((k) => ({ name: `social_${k}`, type: 'url', label: `social.${k}`, hint: 'club.socialHint', pattern: 'https?://.+' })),
  { heading: 'club.colors' },
  { name: 'color_primary', type: 'color', label: 'club.colorPrimary', defaultColor: '#0e5a63' },
  { name: 'color_accent', type: 'color', label: 'club.colorAccent', defaultColor: '#c9a24a' },
  { name: 'color_pitch', type: 'color', label: 'club.colorPitch', defaultColor: '#1d7a4c' }
].filter((f) => f.name !== '_sp1');

bootAdmin({ page: 'club', title: 'admin.nav.club', render: (ctx) => mountSingle(ctx, {
  introKey: 'club.identityHint', fields,
  toForm: (s) => ({ ...s, ...Object.fromEntries(SOCIAL.map((k) => [`social_${k}`, (s.social_links || {})[k] || ''])) }),
  toPayload: (v) => {
    const out = {}; const social = {};
    for (const [k, val] of Object.entries(v)) { if (k.startsWith('social_')) { if (val) social[k.slice(7)] = val; } else out[k] = val; }
    return { ...out, social_links: social };
  }
}) });
