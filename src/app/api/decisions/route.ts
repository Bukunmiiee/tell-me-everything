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
 * Records a decision, updates the application's status, sends an
 * optional email, and logs everything for the audit trail (Item 5)
 * and email log (Item 8).
 *
 * Checks the login session itself, same as /api/reviews, since
 * middleware.ts only covers page routes.
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

    // Capture the previous decision (if any) for the audit trail, before we
    // overwrite the application's status.
    const { data: previousDecision } = await supabase
      .from("decisions")
      .select("choice")
      .eq("application_id", application_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: statusError } = await supabase
      .from("applications")
      .update({ status: option.resultingStatus })
      .eq("id", application_id);

    if (statusError) {
      console.error("Failed to update status:", statusError);
      return NextResponse.json(
        { error: "Couldn't update their status. Please try again." },
        { status: 500 }
      );
    }

    let emailSent = false;
    let emailError: string | null = null;
    let applicantEmailForLog: string | null = null;

    if (send_email) {
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

      applicantEmailForLog = applicant?.email ?? null;

      if (applicant?.email && email_subject && email_body) {
        try {
          const resend = getResendClient();
          const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: applicant.email,
            subject: email_subject,
            text: email_body,
          });
          if (result.error) {
            emailError = result.error.message;
            console.error("Resend returned an error:", result.error);
          } else {
            emailSent = true;
          }
        } catch (err) {
          console.error("Failed to send email:", err);
          emailError = err instanceof Error ? err.message : "Unknown error sending email.";
        }
      }
    }

    const { data: insertedDecision, error: decisionError } = await supabase
      .from("decisions")
      .insert({
        application_id,
        choice,
        email_sent: emailSent,
        email_body: emailSent ? email_body : null,
        changed_by: user.email ?? user.id,
      })
      .select("id")
      .single();

    if (decisionError) {
      console.error("Failed to log decision:", decisionError);
    }

    // Email log (Item 8) — recorded whenever a send was actually attempted,
    // whether it succeeded or failed.
    if (send_email && applicantEmailForLog) {
      const { error: logError } = await supabase.from("email_logs").insert({
        application_id,
        decision_id: insertedDecision?.id ?? null,
        recipient: applicantEmailForLog,
        status: emailSent ? "sent" : "failed",
        error_message: emailSent ? null : emailError,
      });
      if (logError) console.error("Failed to write email log:", logError);
    }

    // Review history entry (Item 5) — captures the decision change too,
    // even though scores didn't change on this request.
    const { error: historyError } = await supabase.from("review_history").insert({
      application_id,
      changed_by: user.email ?? user.id,
      previous_decision: previousDecision?.choice ?? null,
      new_decision: choice,
    });
    if (historyError) console.error("Failed to log decision history:", historyError);

    return NextResponse.json({
      ok: true,
      resultingStatus: option.resultingStatus,
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error("Unexpected error in /api/decisions:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 }
    );
  }
}
