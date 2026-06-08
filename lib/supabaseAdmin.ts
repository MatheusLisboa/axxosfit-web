import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const key = serviceKey || anonKey;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
