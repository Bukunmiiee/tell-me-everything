import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client that reads the admin's login session from
 * cookies. Used in server components / route handlers to check "is this
 * request actually coming from logged-in admin-you?"
 * Still only uses the public anon key — session identity comes from the
 * secure cookie, not from elevated privileges.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without write access — safe to ignore,
            // middleware handles session refresh in that case.
          }
        },
      },
    }
  );
}

/**
 * Admin-privileged client, used ONLY inside server routes/actions that have
 * already confirmed the request is from the logged-in admin. This uses the
 * SERVICE ROLE key, which bypasses Row Level Security entirely — that's
 * intentional and necessary since RLS blocks the public anon key completely.
 *
 * This key is read from a non-NEXT_PUBLIC_ env var, so it is only ever
 * available on the server and is never bundled into browser JavaScript.
 */
import { createClient as createRawClient } from "@supabase/supabase-js";

export function createAdminSupabaseClient() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
