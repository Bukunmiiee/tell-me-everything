export type ApplicationStatus =
  | "in_progress"
  | "submitted"
  | "reading"
  | "still_thinking"
  | "lets_talk_more"
  | "not_right_now";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  in_progress: "In Progress",
  submitted: "Submitted",
  reading: "Reading",
  still_thinking: "Still Thinking",
  lets_talk_more: "Let's Talk More",
  not_right_now: "Not Right Now",
};

/**
 * The ONLY thing an applicant ever sees about their status — a short,
 * human line. Deliberately vague/calm rather than detailed, so it
 * doesn't invite overthinking or reveal anything about the review
 * process itself.
 */
export const STATUS_APPLICANT_MESSAGE: Record<ApplicationStatus, string> = {
  in_progress: "Still filling this out? Pick up right where you left off.",
  submitted: "I've received everything you shared. Thank you for your honesty.",
  reading: "I'm going through what you shared.",
  still_thinking: "I'm still thinking this over — no need to check back too often.",
  lets_talk_more: "I'd like to keep talking. I'll reach out.",
  not_right_now: "I don't think we're the right fit for each other right now. I'm grateful for your honesty.",
};
