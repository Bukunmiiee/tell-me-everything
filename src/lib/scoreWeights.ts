/**
 * THIS IS THE FILE TO EDIT if you want to change how the overall
 * compatibility score is weighted. Change the numbers below —
 * nothing else in the app needs to change. Weights don't need to
 * add up to exactly 1 (they're normalized automatically), but
 * keeping them summing to 1 makes them easiest to reason about.
 *
 * The 7 fields here map to your original four category ideas like this:
 *   Values & Character   → score_values_alignment, score_emotional_maturity
 *   Communication         → score_communication
 *   Lifestyle              → score_financial_responsibility, score_relationship_readiness
 *   Long-Term Goals        → score_intentionality, score_spiritual_alignment
 */
export type ScoreKey =
  | "score_intentionality"
  | "score_emotional_maturity"
  | "score_communication"
  | "score_spiritual_alignment"
  | "score_values_alignment"
  | "score_financial_responsibility"
  | "score_relationship_readiness";

export const SCORE_WEIGHTS: Record<ScoreKey, number> = {
  score_values_alignment: 0.2, // Values & Character (part 1)
  score_emotional_maturity: 0.1, // Values & Character (part 2)
  score_communication: 0.2, // Communication
  score_financial_responsibility: 0.1, // Lifestyle (part 1)
  score_relationship_readiness: 0.1, // Lifestyle (part 2)
  score_intentionality: 0.15, // Long-Term Goals (part 1)
  score_spiritual_alignment: 0.15, // Long-Term Goals (part 2)
};

/**
 * Weighted average of whichever scores have been filled in so far.
 * Missing scores are excluded and the remaining weights are
 * renormalized, so a partially-scored review still produces a
 * sensible number rather than being dragged down by unscored fields.
 */
export function computeWeightedOverall(scores: Partial<Record<ScoreKey, number | null>>): number | null {
  const entries = (Object.keys(SCORE_WEIGHTS) as ScoreKey[])
    .map((key) => ({ key, value: scores[key], weight: SCORE_WEIGHTS[key] }))
    .filter((e): e is { key: ScoreKey; value: number; weight: number } => e.value != null);

  if (entries.length === 0) return null;

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const weightedSum = entries.reduce((sum, e) => sum + e.value * e.weight, 0);

  return Math.round(weightedSum / totalWeight);
}
