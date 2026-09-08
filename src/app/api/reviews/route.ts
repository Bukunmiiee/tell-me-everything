import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

const ReviewSchema = z.object({
  application_id: z.string().uuid(),
  score_intentionality: z.number().min(1).max(10).nullable().optional(),
  score_emotional_maturity: z.number().min(1).max(10).nullable().optional(),
  score_communication: z.number().min(1).max(10).nullable().optional(),
  score_spiritual_alignment: z.number().min(1).max(10).nullable().optional(),
  score_values_alignment: z.number().min(1).max(10).nullable().optional(),
  score_financial_responsibility: z.number().min(1).max(10).nullable().optional(),
  score_relationship_readiness: z.number().min(1).max(10).nullable().optional(),
  score_overall_compatibility: z.number().min(1).max(10).nullable().optional(),
  green_flags: z.string().nullable().optional(),
  concerns: z.string().nullable().optional(),
  ask_in_person: z.string().nullable().optional(),
  general_notes: z.string().nullable().optional(),
  do_not_continue: z.boolean().optional(),
});

/**
 * Saves your private scores/notes for one application.
 *
 * This route is NOT covered by middleware.ts (that only guards page
 * routes like /admin/dashboard), so it checks the login session itself
 * before touching the database. This is what actually keeps your notes
 * private — without this check, anyone who found the URL could write
 * to it.
 */
export async function POST(request: Request) {
  const supabaseAuth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review data." }, { status: 400 });
  }

  const { application_id, ...fields } = parsed.data;

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("reviews")
    .upsert(
      { application_id, ...fields },
      { onConflict: "application_id" }
    );

  if (error) {
    console.error("Failed to save review:", error);
    return NextResponse.json({ error: "Something went wrong saving your notes." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
