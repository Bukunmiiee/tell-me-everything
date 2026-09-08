import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { SECTIONS, getQuestionById } from "@/lib/questions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApplicationStatus } from "@/lib/status";
import { ReviewPanel } from "@/components/admin/ReviewPanel";
import { DecisionPanel } from "@/components/admin/DecisionPanel";

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

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-[24px] text-ink">{applicant.name}</h1>
        <StatusBadge status={application.status as ApplicationStatus} />
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
        />
        <ReviewPanel applicationId={id} initial={reviewDefaults} />
      </div>
    </div>
  );
}
