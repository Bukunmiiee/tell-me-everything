import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_APPLICANT_MESSAGE, ApplicationStatus } from "@/lib/status";
import { notFound } from "next/navigation";

/**
 * This page is reachable by anyone who has the exact token — no login.
 * That's fine because the token is a 64-character random secret (see
 * schema.sql), practically impossible to guess. It deliberately shows
 * almost nothing: just a status badge and one warm sentence. No scores,
 * no notes, no dates, no hint of internal review activity.
 */
export default async function StatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = createAdminSupabaseClient();

  const { data: application } = await supabase
    .from("applications")
    .select("status")
    .eq("status_token", token)
    .single();

  if (!application) {
    notFound();
  }

  const status = application.status as ApplicationStatus;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream-base">
      <div className="w-full max-w-sm text-center py-16">
        <div className="mb-6 flex justify-center">
          <StatusBadge status={status} />
        </div>
        <p className="text-ink text-[17px] leading-relaxed">
          {STATUS_APPLICANT_MESSAGE[status]}
        </p>
      </div>
    </main>
  );
}
