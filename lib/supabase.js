import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('your_supabase_url') &&
  !rawKey.includes('your_supabase_anon_key')
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});


