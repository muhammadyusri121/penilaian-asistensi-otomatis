import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  var __gradingSupabase: SupabaseClient | undefined;
}

function createSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'SUPABASE_URL belum diatur. Tambahkan ke file .env.local sebelum menjalankan aplikasi.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY belum diatur. Tambahkan ke file .env.local sebelum menjalankan aplikasi.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getDb() {
  if (!global.__gradingSupabase) {
    global.__gradingSupabase = createSupabaseClient();
  }

  return global.__gradingSupabase;
}
