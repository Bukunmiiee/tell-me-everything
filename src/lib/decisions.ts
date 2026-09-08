import { ApplicationStatus } from "./status";

export type DecisionChoice =
  | "continue_getting_to_know"
  | "another_conversation"
  | "take_it_slowly"
  | "better_as_friends"
  | "not_compatible";

export const DECISION_OPTIONS: {
  value: DecisionChoice;
  label: string;
  description: string;
  resultingStatus: ApplicationStatus;
}[] = [
  {
    value: "continue_getting_to_know",
    label: "Continue Getting to Know Each Other",
    description: "Things are going well — keep going.",
    resultingStatus: "lets_talk_more",
  },
  {
    value: "another_conversation",
    label: "I'd Like Another Conversation",
    description: "A few things worth talking through before deciding.",
    resultingStatus: "lets_talk_more",
  },
  {
    value: "take_it_slowly",
    label: "Let's Take Things Slowly",
    description: "Not a no — just not rushing either.",
    resultingStatus: "still_thinking",
  },
  {
    value: "better_as_friends",
    label: "Better as Friends",
    description: "Not a romantic fit, but worth staying kind.",
    resultingStatus: "not_right_now",
  },
  {
    value: "not_compatible",
    label: "Not Compatible Right Now",
    description: "This isn't the right match at this time.",
    resultingStatus: "not_right_now",
  },
];
