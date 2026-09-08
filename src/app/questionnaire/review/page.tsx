"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SECTIONS } from "@/lib/questions";
import { useDraftAnswers } from "@/hooks/useDraftAnswers";
import { Button } from "@/components/ui/Button";

export default function ReviewAnswersPage() {
  const router = useRouter();
  const { answers, clearDraft, hydrated } = useDraftAnswers();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error === "Some required questions are missing answers."
            ? "A few required answers are missing — please go back and fill them in."
            : "Something went wrong on our end. Please try again in a moment."
        );
        setSubmitting(false);
        return;
      }

      // Save the token locally so the confirmation page can show the status link,
      // then clear the draft — the data now safely lives in the database.
      window.localStorage.setItem("tme_status_token", data.token);
      clearDraft();
      router.push("/questionnaire/submitted");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  return (
    <main className="min-h-screen bg-cream-base px-6 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-[26px] text-ink mb-2">
          Here&apos;s everything, before you send it
        </h1>
        <p className="text-ink-soft text-[15px] mb-8">
          Take one more look. You can edit any section.
        </p>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.id} className="bg-white border border-taupe-line rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-[18px] text-ink">{section.title}</h2>
                <button
                  onClick={() => router.push("/questionnaire/form")}
                  className="text-[13px] text-wine-primary hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-3">
                {section.questions.map((q) => (
                  <div key={q.id}>
                    <p className="text-[13px] text-ink-soft">{q.label}</p>
                    <p className="text-[15px] text-ink line-clamp-2">
                      {answers[q.id] || <span className="italic text-ink-soft">Not answered</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-6 text-[14px] italic text-wine-primary">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending…" : "Submit"}
          </Button>
        </div>
      </div>
    </main>
  );
}
