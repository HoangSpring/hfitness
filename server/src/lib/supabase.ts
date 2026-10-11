import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export const createUserSupabaseClient = (accessToken: string): SupabaseClient =>
  createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

export const serviceSupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

