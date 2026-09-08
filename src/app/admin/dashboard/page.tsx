import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApplicationStatus } from "@/lib/status";

// This page shows live data from the database — never cache it as static.
export const dynamic = "force-dynamic";


interface ApplicantRow {
  application_id: string;
  applicant_id: string;
  name: string;
  age: number | null;
  occupation: string | null;
  status: ApplicationStatus;
  submitted_at: string | null;
}

async function getApplicants(): Promise<ApplicantRow[]> {
  // This runs on the server only, after middleware.ts has already confirmed
  // the request comes from your logged-in session. Using the service-role
  // client here is safe because this file never runs in the browser.
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, submitted_at, applicants(id, name, age, occupation)")
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (error || !data) {
    console.error("Failed to load applicants:", error);
    return [];
  }

  return data
    .filter((row) => row.applicants) // skip any orphaned/incomplete rows
    .map((row) => {
      const applicant = Array.isArray(row.applicants) ? row.applicants[0] : row.applicants;
      return {
        application_id: row.id,
        applicant_id: applicant.id,
        name: applicant.name,
        age: applicant.age,
        occupation: applicant.occupation,
        status: row.status as ApplicationStatus,
        submitted_at: row.submitted_at,
      };
    });
}

export default async function AdminDashboardPage() {
  const applicants = await getApplicants();

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-[24px] text-ink mb-1">Applicants</h1>
      <p className="text-ink-soft text-[14px] mb-8">
        {applicants.length} {applicants.length === 1 ? "person has" : "people have"} shared their answers.
      </p>

      {applicants.length === 0 ? (
        <EmptyState message="No one's answered yet. Once you send your first link, they'll appear here." />
      ) : (
        <div className="space-y-3">
          {applicants.map((a) => (
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
                <StatusBadge status={a.status} />
              </div>
              {a.submitted_at && (
                <p className="text-[12px] text-ink-soft mt-2">
                  Submitted {new Date(a.submitted_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
