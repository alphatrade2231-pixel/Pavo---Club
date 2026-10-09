// Single Supabase client shared by the public site and the admin panel.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

export const BUCKETS = Object.freeze({
  club: 'club-assets', players: 'player-photos', news: 'news-images', gallery: 'gallery-images'
});

/** Public URL for a stored image path (never a temporary blob: URL). */
export function imageUrl(bucket, path) {
  if (!path) return '';
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
