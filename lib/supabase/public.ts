import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Anon-key client for anonymous, public reads (public athlete page, public
// school roster page, sitemap). Deliberately NOT the service-role client --
// organizations_public and athlete_profiles_public are views granted to
// `anon` precisely so these pages never need elevated privileges.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
