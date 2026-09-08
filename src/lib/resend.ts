import { Resend } from "resend";

/**
 * Server-only — the Resend API key is a secret env var (no NEXT_PUBLIC_
 * prefix), so this file can never run in the browser bundle.
 */
export function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}
