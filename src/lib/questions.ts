/**
 * THIS IS THE FILE TO EDIT if you ever want to add, remove, or reword
 * questions later. Nothing else in the app needs to change — the
 * database stores answers as flexible question_id/answer pairs, so
 * editing this file is safe at any time, even after people have
 * already submitted.
 *
 * Each `id` must stay unique and, once people have started answering,
 * shouldn't be renamed (renaming = a "new" question as far as saved
 * answers are concerned). Reordering, rewording labels, and adding
 * brand-new questions are all totally safe.
 */

export type QuestionType = "text" | "textarea" | "radio" | "select";

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export const SECTIONS: Section[] = [
  {
    id: "basics",
    title: "The Basics",
    questions: [
      { id: "name", label: "Your name", type: "text", required: true },
      { id: "age", label: "Age", type: "text", required: true },
      { id: "occupation", label: "What do you do?", type: "text", required: true },
      {
        id: "has_children",
        label: "Do you have children?",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "email",
        label: "Email (optional)",
        type: "text",
        required: false,
        placeholder: "Only if you'd like updates on where things stand",
      },
    ],
  },
  {
    id: "intentions",
    title: "Intentions",
    description: "There are no perfect answers here — just honest ones.",
    questions: [
      {
        id: "intentions_looking_for",
        label: "What are you looking for right now, and what would commitment realistically look like for you?",
        type: "textarea",
        required: true,
      },
      {
        id: "intentions_why_me",
        label: "What made you interested in getting to know me specifically?",
        type: "textarea",
        required: true,
      },
      {
        id: "intentions_future",
        label: "Where do you see yourself, personally and romantically, in the next 3–5 years?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "history-maturity",
    title: "History & Growth",
    questions: [
      {
        id: "history_last_relationship",
        label: "Why did your last serious relationship end, and what did it teach you?",
        type: "textarea",
        required: true,
      },
      {
        id: "maturity_hurt_response",
        label: "If I told you something you did hurt me, how would you handle that conversation?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    questions: [
      {
        id: "comm_good_communication",
        label: "What does good communication look like to you in a relationship?",
        type: "textarea",
        required: true,
      },
      {
        id: "comm_frequency",
        label: "How often do you naturally like communicating with someone you're dating?",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "faith",
    title: "Faith",
    description: "Spiritual alignment matters to me — this isn't a theology test, just honesty.",
    questions: [
      {
        id: "faith_relationship",
        label: "How would you describe your relationship with faith right now?",
        type: "textarea",
        required: true,
      },
      {
        id: "faith_family",
        label: "What would faith look like in the way we raise a family, if we got there?",
        type: "textarea",
        required: true,
      },
      {
        id: "faith_daily",
        label: "How do you want faith to show up in day-to-day decisions, not just the big ones?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "values",
    title: "Values",
    questions: [
      {
        id: "values_top_three",
        label: "What are the three things you value most in a relationship?",
        type: "textarea",
        required: true,
      },
      {
        id: "values_loyalty",
        label: "What does loyalty mean to you?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "money",
    title: "Money & Responsibility",
    questions: [
      {
        id: "money_mindset",
        label: "How do you generally think about money — spending, saving, planning ahead?",
        type: "textarea",
        required: true,
      },
      {
        id: "money_splitting",
        label: "How do you feel about splitting costs versus one person covering things, especially early on?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "boundaries-conflict",
    title: "Boundaries & Conflict",
    questions: [
      {
        id: "boundaries_clear",
        label: "What, to you, is a clear boundary that shouldn't be crossed once we're exclusive?",
        type: "textarea",
        required: true,
      },
      {
        id: "conflict_handling",
        label: "How do you prefer to handle disagreements?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "closing",
    title: "Last Few Things",
    questions: [
      {
        id: "closing_intentions_with_me",
        label: "What are your intentions with me, specifically?",
        type: "textarea",
        required: true,
      },
      {
        id: "closing_expectations",
        label: "What would you expect from me as your girlfriend?",
        type: "textarea",
        required: true,
      },
      {
        id: "closing_anything_else",
        label: "Is there anything you think I should know before you're seriously considered?",
        type: "textarea",
        required: false,
      },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = SECTIONS.flatMap((s) => s.questions);

export function getQuestionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export const TOTAL_SECTIONS = SECTIONS.length;
