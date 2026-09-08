import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { SubmissionSchema, findMissingRequiredAnswers } from "@/lib/validation";
import { ALL_QUESTIONS } from "@/lib/questions";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission format." }, { status: 400 });
  }

  const { answers } = parsed.data;

  const missing = findMissingRequiredAnswers(answers);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Some required questions are missing answers.", missing },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();

  // Pull the "basics" fields out into their own applicant columns;
  // everything else is stored as flexible question/answer rows.
  const name = answers["name"]?.trim();
  const age = answers["age"] ? Number(answers["age"]) : null;
  const occupation = answers["occupation"]?.trim() ?? null;
  const hasChildren = answers["has_children"] === "yes";
  const email = answers["email"]?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
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
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
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
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Store every answer (including the basics fields, for a complete record)
  const responseRows = ALL_QUESTIONS.filter((q) => answers[q.id]?.trim()).map((q) => ({
    application_id: application.id,
    question_id: q.id,
    answer: answers[q.id],
  }));

  const { error: responsesError } = await supabase.from("responses").insert(responseRows);

  if (responsesError) {
    console.error("Failed to save responses:", responsesError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ token: application.status_token });
}
