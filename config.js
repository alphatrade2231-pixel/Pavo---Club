// =====================================================================
// Supabase connection settings — the ONLY file you edit to connect the site.
// Use the project URL and the *publishable* (anon) key from
// Supabase Dashboard > Project Settings > API.
// NEVER put the service_role / secret key in this folder.
// =====================================================================
export const SUPABASE_URL = https://uocmcuisetabyiuihxch.supabase.co/rest/v1/
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P8Q5gS_osuJsK5M1X4q8cQ_b1fBjQfA';

export const isConfigured = () =>
  !/YOUR-PROJECT-REF|YOUR_PUBLISHABLE_KEY/.test(SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY);
