export type CompletionStatus = "not_started" | "review_saved" | "decision_made" | "email_sent";

export const COMPLETION_LABELS: Record<CompletionStatus, string> = {
  not_started: "Not Started",
  review_saved: "Review Saved",
  decision_made: "Decision Made",
  email_sent: "Email Sent",
};

const COMPLETION_STYLES: Record<CompletionStatus, string> = {
  not_started: "bg-cream-alt text-ink-soft",
  review_saved: "bg-blush-light text-ink",
  decision_made: "bg-[#B8935F26] text-gold-accent",
  email_sent: "bg-[#7A8B6F26] text-success-sage",
};

export function computeCompletionStatus(args: {
  hasReview: boolean;
  hasDecision: boolean;
  emailSent: boolean;
}): CompletionStatus {
  if (args.emailSent) return "email_sent";
  if (args.hasDecision) return "decision_made";
  if (args.hasReview) return "review_saved";
  return "not_started";
}

export function CompletionBadge({ status }: { status: CompletionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium ${COMPLETION_STYLES[status]}`}
    >
      {COMPLETION_LABELS[status]}
    </span>
  );
}
