import { z } from "zod";
import { ALL_QUESTIONS } from "./questions";

const requiredIds = ALL_QUESTIONS.filter((q) => q.required).map((q) => q.id);

export const SubmissionSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

/**
 * Server-side check that every required question actually has a
 * non-empty answer. The form already checks this in the browser,
 * but the browser can be bypassed (dev tools, direct API calls),
 * so we check again here before writing anything to the database.
 */
export function findMissingRequiredAnswers(answers: Record<string, string>): string[] {
  return requiredIds.filter((id) => !answers[id]?.trim());
}
