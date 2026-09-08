"use client";

import { useState } from "react";

interface ReviewData {
  score_intentionality: number | null;
  score_emotional_maturity: number | null;
  score_communication: number | null;
  score_spiritual_alignment: number | null;
  score_values_alignment: number | null;
  score_financial_responsibility: number | null;
  score_relationship_readiness: number | null;
  score_overall_compatibility: number | null;
  green_flags: string | null;
  concerns: string | null;
  ask_in_person: string | null;
  general_notes: string | null;
  do_not_continue: boolean;
}

const SCORE_FIELDS: { key: keyof ReviewData; label: string }[] = [
  { key: "score_intentionality", label: "Intentionality" },
  { key: "score_emotional_maturity", label: "Emotional Maturity" },
  { key: "score_communication", label: "Communication" },
  { key: "score_spiritual_alignment", label: "Spiritual Alignment" },
  { key: "score_values_alignment", label: "Values Alignment" },
  { key: "score_financial_responsibility", label: "Financial Responsibility" },
  { key: "score_relationship_readiness", label: "Relationship Readiness" },
  { key: "score_overall_compatibility", label: "Overall Compatibility" },
];

const NOTE_FIELDS: { key: keyof ReviewData; label: string; placeholder: string }[] = [
  { key: "green_flags", label: "Green Flags", placeholder: "What stood out positively…" },
  { key: "concerns", label: "Potential Concerns", placeholder: "Anything giving you pause…" },
  { key: "ask_in_person", label: "Things to Ask in Person", placeholder: "Follow-up questions for later…" },
  { key: "general_notes", label: "General Notes", placeholder: "Anything else…" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export function ReviewPanel({
  applicationId,
  initial,
}: {
  applicationId: string;
  initial: ReviewData;
}) {
  const [data, setData] = useState<ReviewData>(initial);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function persist(next: ReviewData) {
    setSaveState("saving");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId, ...next }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  function updateField<K extends keyof ReviewData>(key: K, value: ReviewData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="bg-white border border-wine-primary/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-[18px] text-ink">Your Private Review</h2>
        <SaveIndicator state={saveState} />
      </div>
      <p className="text-[12px] text-ink-soft mb-6 italic">
        Private — never shown to the applicant.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {SCORE_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[12px] text-ink-soft mb-1">{label}</label>
            <select
              value={(data[key] as number | null) ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                const next = { ...data, [key]: val };
                updateField(key, val as never);
                persist(next);
              }}
              className="w-full rounded-md border border-taupe-line bg-white px-2 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-wine-primary/20 focus:border-wine-primary"
            >
              <option value="">—</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {NOTE_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-[13px] text-ink-soft mb-1.5">{label}</label>
            <textarea
              value={(data[key] as string | null) ?? ""}
              placeholder={placeholder}
              rows={3}
              onChange={(e) => updateField(key, e.target.value as never)}
              onBlur={() => persist(data)}
              className="w-full rounded-md border border-taupe-line bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-wine-primary/20 focus:border-wine-primary"
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 mt-6 text-[14px] text-ink-soft cursor-pointer">
        <input
          type="checkbox"
          checked={data.do_not_continue}
          onChange={(e) => {
            const next = { ...data, do_not_continue: e.target.checked };
            updateField("do_not_continue", e.target.checked);
            persist(next);
          }}
          className="h-4 w-4 accent-wine-primary"
        />
        Flag: Do Not Continue
      </label>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const text =
    state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Couldn't save — try again";
  const color = state === "error" ? "text-wine-primary" : "text-ink-soft";
  return <span className={`text-[12px] ${color}`}>{text}</span>;
}
