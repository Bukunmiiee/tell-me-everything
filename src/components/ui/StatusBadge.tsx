import { ApplicationStatus, STATUS_LABELS } from "@/lib/status";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  in_progress: "bg-cream-alt text-ink-soft",
  submitted: "bg-blush-light text-ink",
  reading: "bg-blush-light text-ink",
  still_thinking: "bg-cream-alt text-ink-soft",
  lets_talk_more: "bg-[#7A8B6F26] text-success-sage",
  not_right_now: "bg-taupe-line/40 text-ink-soft",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
