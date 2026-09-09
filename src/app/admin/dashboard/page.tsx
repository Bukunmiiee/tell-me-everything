import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApplicationStatus } from "@/lib/status";
import { CompletionBadge, computeCompletionStatus } from "@/components/ui/CompletionBadge";

// This page shows live data from the database — never cache it as static.
export const dynamic = "force-dynamic";

const APPROVED_CHOICES = ["continue_getting_to_know", "another_conversation", "take_it_slowly"];
const REJECTED_CHOICES = ["better_as_friends", "not_compatible"];

interface ApplicantRow {
  application_id: string;
  applicant_id: string;
  name: string;
  age: number | null;
  occupation: string | null;
  status: ApplicationStatus;
  submitted_at: string | null;
  hasReview: boolean;
  overallScore: number | null;
  latestDecisionChoice: string | null;
  emailSent: boolean;
}

async function getApplicants(): Promise<ApplicantRow[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      `id, status, submitted_at,
       applicants(id, name, age, occupation),
       reviews(score_overall_compatibility),
       decisions(choice, email_sent, created_at)`
    )
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (error || !data) {
    console.error("Failed to load applicants:", error);
    return [];
  }

  return data
    .filter((row) => row.applicants)
    .map((row) => {
      const applicant = Array.isArray(row.applicants) ? row.applicants[0] : row.applicants;
      const review = Array.isArray(row.reviews) ? row.reviews[0] : row.reviews;
      const decisions = Array.isArray(row.decisions) ? row.decisions : row.decisions ? [row.decisions] : [];
      const latestDecision = decisions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        application_id: row.id,
        applicant_id: applicant.id,
        name: applicant.name,
        age: applicant.age,
        occupation: applicant.occupation,
        status: row.status as ApplicationStatus,
        submitted_at: row.submitted_at,
        hasReview: Boolean(review?.score_overall_compatibility != null),
        overallScore: review?.score_overall_compatibility ?? null,
        latestDecisionChoice: latestDecision?.choice ?? null,
        emailSent: latestDecision?.email_sent ?? false,
      };
    });
}

export default async function AdminDashboardPage() {
  const applicants = await getApplicants();

  // Metrics (Item 9)
  const total = applicants.length;
  const pending = applicants.filter((a) => !a.latestDecisionChoice).length;
  const approved = applicants.filter(
    (a) => a.latestDecisionChoice && APPROVED_CHOICES.includes(a.latestDecisionChoice)
  ).length;
  const rejected = applicants.filter(
    (a) => a.latestDecisionChoice && REJECTED_CHOICES.includes(a.latestDecisionChoice)
  ).length;
  const scored = applicants.filter((a) => a.overallScore != null);
  const avgScore =
    scored.length > 0
      ? (scored.reduce((sum, a) => sum + (a.overallScore ?? 0), 0) / scored.length).toFixed(1)
      : "—";

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-[24px] text-ink mb-1">Applicants</h1>
      <p className="text-ink-soft text-[14px] mb-6">
        {total} {total === 1 ? "person has" : "people have"} shared their answers.
      </p>

      {/* Metrics row (Item 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <MetricCard label="Total" value={total} />
        <MetricCard label="Pending" value={pending} />
        <MetricCard label="Approved" value={approved} />
        <MetricCard label="Rejected" value={rejected} />
        <MetricCard label="Avg. Score" value={avgScore} />
      </div>

      <p className="text-[12px] text-ink-soft italic mb-8">
        Decisions are always available on each applicant&apos;s private status page.
        Email notifications are optional and may be unavailable depending on email configuration.
      </p>

      {applicants.length === 0 ? (
        <EmptyState message="No one's answered yet. Once you send your first link, they'll appear here." />
      ) : (
        <div className="space-y-3">
          {applicants.map((a) => {
            const completion = computeCompletionStatus({
              hasReview: a.hasReview,
              hasDecision: Boolean(a.latestDecisionChoice),
              emailSent: a.emailSent,
            });
            return (
              <Link
                key={a.application_id}
                href={`/admin/applicants/${a.application_id}`}
                className="block bg-white border border-taupe-line rounded-xl p-5 hover:border-blush transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[16px] text-ink font-medium truncate">{a.name}</p>
                    <p className="text-[13px] text-ink-soft truncate">
                      {[a.age && `${a.age}`, a.occupation].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={a.status} />
                    <CompletionBadge status={completion} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {a.submitted_at && (
                    <p className="text-[12px] text-ink-soft">
                      Submitted{" "}
                      {new Date(a.submitted_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {a.overallScore != null && (
                    <p className="text-[12px] text-ink-soft">Score: {a.overallScore}/10</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-taupe-line rounded-lg px-3 py-3 text-center">
      <p className="text-[20px] font-display text-wine-primary">{value}</p>
      <p className="text-[11px] text-ink-soft">{label}</p>
    </div>
  );
}
