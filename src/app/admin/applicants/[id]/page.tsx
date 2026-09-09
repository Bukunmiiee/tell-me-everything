import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { SECTIONS, getQuestionById } from "@/lib/questions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApplicationStatus } from "@/lib/status";
import { ReviewPanel } from "@/components/admin/ReviewPanel";
import { DecisionPanel } from "@/components/admin/DecisionPanel";
import { CompletionBadge, computeCompletionStatus } from "@/components/ui/CompletionBadge";
import { DECISION_OPTIONS } from "@/lib/decisions";

export const dynamic = "force-dynamic";

export default async function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, submitted_at, applicants(id, name, age, occupation, has_children, email)")
    .eq("id", id)
    .single();

  if (!application) notFound();

  const applicant = Array.isArray(application.applicants)
    ? application.applicants[0]
    : application.applicants;

  const { data: responses } = await supabase
    .from("responses")
    .select("question_id, answer")
    .eq("application_id", id);

  const answerMap: Record<string, string> = {};
  for (const r of responses ?? []) {
    answerMap[r.question_id] = r.answer ?? "";
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("application_id", id)
    .single();

  const { data: latestDecision } = await supabase
    .from("decisions")
    .select("choice, email_sent, created_at")
    .eq("application_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Review history (Item 5) — every save creates one of these rows.
  const { data: history } = await supabase
    .from("review_history")
    .select("changed_by, changed_at, previous_scores, new_scores, previous_decision, new_decision")
    .eq("application_id", id)
    .order("changed_at", { ascending: false })
    .limit(20);

  // Email log (Item 8) — every send attempt, success or failure.
  const { data: emailLogs } = await supabase
    .from("email_logs")
    .select("recipient, status, error_message, sent_at")
    .eq("application_id", id)
    .order("sent_at", { ascending: false });

  const reviewDefaults = {
    score_intentionality: review?.score_intentionality ?? null,
    score_emotional_maturity: review?.score_emotional_maturity ?? null,
    score_communication: review?.score_communication ?? null,
    score_spiritual_alignment: review?.score_spiritual_alignment ?? null,
    score_values_alignment: review?.score_values_alignment ?? null,
    score_financial_responsibility: review?.score_financial_responsibility ?? null,
    score_relationship_readiness: review?.score_relationship_readiness ?? null,
    score_overall_compatibility: review?.score_overall_compatibility ?? null,
    green_flags: review?.green_flags ?? null,
    concerns: review?.concerns ?? null,
    ask_in_person: review?.ask_in_person ?? null,
    general_notes: review?.general_notes ?? null,
    do_not_continue: review?.do_not_continue ?? false,
  };

  const completion = computeCompletionStatus({
    hasReview: review?.score_overall_compatibility != null,
    hasDecision: Boolean(latestDecision?.choice),
    emailSent: Boolean(latestDecision?.email_sent),
  });

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-[24px] text-ink">{applicant.name}</h1>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={application.status as ApplicationStatus} />
          <CompletionBadge status={completion} />
        </div>
      </div>
      <p className="text-ink-soft text-[14px] mb-8">
        {[applicant.age && `${applicant.age}`, applicant.occupation, applicant.has_children ? "Has children" : "No children"]
          .filter(Boolean)
          .join(" · ")}
        {application.submitted_at &&
          ` · Submitted ${new Date(application.submitted_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`}
      </p>

      <div className="space-y-6 mb-10">
        {SECTIONS.map((section) => (
          <div key={section.id} className="bg-white border border-taupe-line rounded-xl p-6">
            <h2 className="font-display text-[17px] text-ink mb-4">{section.title}</h2>
            <div className="space-y-4">
              {section.questions.map((q) => {
                const answer = answerMap[q.id];
                if (!answer) return null;
                return (
                  <div key={q.id}>
                    <p className="text-[13px] text-ink-soft mb-1">{getQuestionById(q.id)?.label}</p>
                    <p className="text-[15px] text-ink whitespace-pre-wrap leading-relaxed">
                      {answer}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <DecisionPanel
          applicationId={id}
          currentStatus={application.status as ApplicationStatus}
          applicantName={applicant.name}
          applicantEmail={applicant.email ?? null}
          initialChoice={latestDecision?.choice ?? null}
          initialEmailSent={latestDecision?.email_sent ?? false}
          initialDecidedAt={latestDecision?.created_at ?? null}
        />
        <ReviewPanel applicationId={id} initial={reviewDefaults} />

        {/* Email log (Item 8) */}
        {emailLogs && emailLogs.length > 0 && (
          <div className="bg-white border border-taupe-line rounded-xl p-6">
            <h2 className="font-display text-[16px] text-ink mb-4">Email Log</h2>
            <div className="space-y-2">
              {emailLogs.map((log, i) => (
                <div key={i} className="flex items-start justify-between text-[13px] border-b border-taupe-line last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="text-ink">{log.recipient}</p>
                    {log.error_message && (
                      <p className="text-wine-primary italic text-[12px]">{log.error_message}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={log.status === "sent" ? "text-success-sage" : "text-wine-primary"}>
                      {log.status === "sent" ? "Sent" : "Failed"}
                    </p>
                    <p className="text-ink-soft text-[11px]">
                      {new Date(log.sent_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review history / audit trail (Item 5) */}
        {history && history.length > 0 && (
          <div className="bg-white border border-taupe-line rounded-xl p-6">
            <h2 className="font-display text-[16px] text-ink mb-1">History</h2>
            <p className="text-[12px] text-ink-soft italic mb-4">
              A record of every change made to this review, for your own reference.
            </p>
            <div className="space-y-3">
              {history.map((h, i) => {
                const prevOverall = h.previous_scores?.score_overall_compatibility;
                const newOverall = h.new_scores?.score_overall_compatibility;
                const scoreChanged = prevOverall !== newOverall && newOverall != null;
                const decisionChanged = h.new_decision && h.new_decision !== h.previous_decision;
                return (
                  <div key={i} className="text-[13px] border-b border-taupe-line last:border-0 pb-3 last:pb-0">
                    <p className="text-ink-soft text-[12px]">
                      {new Date(h.changed_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {h.changed_by && ` · ${h.changed_by}`}
                    </p>
                    {scoreChanged && (
                      <p className="text-ink">
                        Overall score: {prevOverall ?? "—"} → {newOverall}
                      </p>
                    )}
                    {decisionChanged && (
                      <p className="text-ink">
                        Decision: {DECISION_OPTIONS.find((o) => o.value === h.previous_decision)?.label ?? "—"} →{" "}
                        {DECISION_OPTIONS.find((o) => o.value === h.new_decision)?.label}
                      </p>
                    )}
                    {!scoreChanged && !decisionChanged && (
                      <p className="text-ink-soft italic">Notes updated</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
