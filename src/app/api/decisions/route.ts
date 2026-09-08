import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { DECISION_OPTIONS, DecisionChoice } from "@/lib/decisions";
import { getResendClient } from "@/lib/resend";

const DecisionSchema = z.object({
  application_id: z.string().uuid(),
  choice: z.enum([
    "continue_getting_to_know",
    "another_conversation",
    "take_it_slowly",
    "better_as_friends",
    "not_compatible",
  ]),
  send_email: z.boolean().optional().default(false),
  email_subject: z.string().max(200).optional(),
  email_body: z.string().max(5000).optional(),
});

/**
 * Records a decision, updates the application's status, and — if
 * requested — sends the applicant an email via Resend using whatever
 * subject/body you've edited in the admin UI.
 *
 * Checks the login session itself, same as /api/reviews, since
 * middleware.ts only covers page routes.
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

  const parsed = DecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const { application_id, choice, send_email, email_subject, email_body } = parsed.data;
  const option = DECISION_OPTIONS.find((o) => o.value === (choice as DecisionChoice));

  if (!option) {
    return NextResponse.json({ error: "Unknown decision choice." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { error: statusError } = await supabase
    .from("applications")
    .update({ status: option.resultingStatus })
    .eq("id", application_id);

  if (statusError) {
    console.error("Failed to update status:", statusError);
    return NextResponse.json({ error: "Couldn't update status." }, { status: 500 });
  }

  let emailSent = false;

  if (send_email) {
    // Look up the applicant's email — only sends if they provided one.
    const { data: appRow } = await supabase
      .from("applications")
      .select("applicants(email)")
      .eq("id", application_id)
      .single();

    const applicant = appRow?.applicants
      ? Array.isArray(appRow.applicants)
        ? appRow.applicants[0]
        : appRow.applicants
      : null;

    if (applicant?.email && email_subject && email_body) {
      try {
        const resend = getResendClient();
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: applicant.email,
          subject: email_subject,
          text: email_body,
        });
        emailSent = true;
      } catch (err) {
        console.error("Failed to send email:", err);
        // Status/decision are already saved — don't fail the whole request
        // over the email. The response below reports emailSent: false so
        // the UI can tell the admin it didn't go out.
      }
    }
  }

  const { error: decisionError } = await supabase.from("decisions").insert({
    application_id,
    choice,
    email_sent: emailSent,
    email_body: emailSent ? email_body : null,
  });

  if (decisionError) {
    console.error("Failed to log decision:", decisionError);
  }

  return NextResponse.json({ ok: true, resultingStatus: option.resultingStatus, emailSent });
}
