import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // getAll/setAll (not the legacy get/set/remove trio) is required
        // for @supabase/ssr to correctly reassemble a session cookie that
        // Supabase has split into chunks -- the legacy per-cookie adapter
        // silently drops chunks and produces an unauthenticated client.
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // called from a Server Component with no request context to
            // write to; middleware refreshes the session instead.
          }
        },
      },
    }
  );
}
