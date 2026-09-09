import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { SubmissionSchema, findMissingRequiredAnswers } from "@/lib/validation";
import { ALL_QUESTIONS } from "@/lib/questions";

const RequestSchema = SubmissionSchema.extend({
  // Set to true once the applicant has confirmed they want to submit again
  // despite the duplicate-email warning (Item 10).
  force: z.boolean().optional().default(false),
});

/**
 * Handles the final "Submit" click from the questionnaire.
 *
 * This is the ONLY place in the whole app where the applicant's answers
 * ever reach the database — everything before this point lived only in
 * their own browser (see useDraftAnswers). No login is required to call
 * this route; it's a public endpoint, but it only ever creates new
 * records — it can't read or modify anyone else's data.
 *
 * Uses the SERVICE ROLE key (server-side only, see lib/supabase/server.ts)
 * because Row Level Security intentionally blocks the public key from
 * writing anything at all.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission format." }, { status: 400 });
    }

    const { answers, force } = parsed.data;

    const missing = findMissingRequiredAnswers(answers);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Some required questions are missing answers.", missing },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const name = answers["name"]?.trim();
    const age = answers["age"] ? Number(answers["age"]) : null;
    const occupation = answers["occupation"]?.trim() ?? null;
    const hasChildren = answers["has_children"] === "yes";
    const email = answers["email"]?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    // Duplicate submission check (Item 10) — only meaningful when an email
    // was provided, since that's the only reliable identifier we collect.
    if (email && !force) {
      const { data: existing } = await supabase
        .from("applicants")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          {
            duplicate: true,
            error: "It looks like this email has already submitted an application.",
          },
          { status: 409 }
        );
      }
    }

    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .insert({
        name,
        age: Number.isFinite(age) ? age : null,
        occupation,
        has_children: hasChildren,
        email,
      })
      .select("id")
      .single();

    if (applicantError || !applicant) {
      console.error("Failed to create applicant:", applicantError);
      return NextResponse.json(
        { error: "Something went wrong on our end. Please try again." },
        { status: 500 }
      );
    }

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .insert({
        applicant_id: applicant.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select("id, status_token")
      .single();

    if (applicationError || !application) {
      console.error("Failed to create application:", applicationError);
      return NextResponse.json(
        { error: "Something went wrong on our end. Please try again." },
        { status: 500 }
      );
    }

    const responseRows = ALL_QUESTIONS.filter((q) => answers[q.id]?.trim()).map((q) => ({
      application_id: application.id,
      question_id: q.id,
      answer: answers[q.id],
    }));

    const { error: responsesError } = await supabase.from("responses").insert(responseRows);

    if (responsesError) {
      console.error("Failed to save responses:", responsesError);
      return NextResponse.json(
        { error: "Something went wrong on our end. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ token: application.status_token });
  } catch (err) {
    console.error("Unexpected error in /api/submit:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }
}
