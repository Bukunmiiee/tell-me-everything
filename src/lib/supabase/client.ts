import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Uses only the public anon key — this is safe to ship to the browser.
 * With RLS enabled and no public policies (see schema.sql), this client
 * cannot read or write any application data. It is used ONLY for the
 * admin login form (Supabase Auth's sign-in call happens client-side).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
