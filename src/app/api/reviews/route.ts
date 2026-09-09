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

const SCORE_KEYS = [
  "score_intentionality",
  "score_emotional_maturity",
  "score_communication",
  "score_spiritual_alignment",
  "score_values_alignment",
  "score_financial_responsibility",
  "score_relationship_readiness",
  "score_overall_compatibility",
] as const;

/**
 * Saves your private scores/notes for one application, and logs a
 * history entry every time (Item 5: audit trail) — capturing who
 * made the change, when, and what the scores were before/after.
 *
 * This route is NOT covered by middleware.ts (that only guards page
 * routes like /admin/dashboard), so it checks the login session itself
 * before touching the database.
 */
export async function POST(request: Request) {
  try {
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

    // Capture "before" scores for the audit trail, prior to overwriting.
    const { data: previousReview } = await supabase
      .from("reviews")
      .select(SCORE_KEYS.join(","))
      .eq("application_id", application_id)
      .single();

    const { error } = await supabase
      .from("reviews")
      .upsert({ application_id, ...fields }, { onConflict: "application_id" });

    if (error) {
      console.error("Failed to save review:", error);
      return NextResponse.json(
        { error: "Something went wrong saving your review. Please try again." },
        { status: 500 }
      );
    }

    const newScores: Record<string, number | null> = {};
    for (const key of SCORE_KEYS) {
      newScores[key] = (fields as Record<string, number | null | undefined>)[key] ?? null;
    }

    const { error: historyError } = await supabase.from("review_history").insert({
      application_id,
      changed_by: user.email ?? user.id,
      previous_scores: previousReview ?? null,
      new_scores: newScores,
    });

    if (historyError) {
      // Don't fail the whole save over the audit log — the review itself
      // saved successfully, which matters more.
      console.error("Failed to log review history:", historyError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in /api/reviews:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }
}
