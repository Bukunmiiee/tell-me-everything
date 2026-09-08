"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SECTIONS, TOTAL_SECTIONS } from "@/lib/questions";
import { useDraftAnswers } from "@/hooks/useDraftAnswers";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Button } from "@/components/ui/Button";

export default function QuestionnaireFormPage() {
  const router = useRouter();
  const { answers, updateAnswer, hydrated } = useDraftAnswers();
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const section = SECTIONS[stepIndex];
  const isLastStep = stepIndex === SECTIONS.length - 1;

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};
    for (const q of section.questions) {
      if (q.required && !answers[q.id]?.trim()) {
        newErrors[q.id] = "This one matters — please fill it in.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleContinue() {
    if (!validateStep()) return;
    if (isLastStep) {
      router.push("/questionnaire/review");
    } else {
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) {
    // Brief skeleton while we read localStorage, avoids a flash of empty fields
    return (
      <main className="min-h-screen bg-cream-base px-6 py-10">
        <div className="max-w-lg mx-auto animate-pulse space-y-4">
          <div className="h-2 bg-cream-alt rounded-full w-full" />
          <div className="h-24 bg-cream-alt rounded-md w-full" />
          <div className="h-24 bg-cream-alt rounded-md w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-base px-6 pt-10 pb-28">
      <div className="max-w-lg mx-auto">
        <ProgressBar current={stepIndex + 1} total={TOTAL_SECTIONS} label={section.title} />

        <div className="mt-10 space-y-8">
          {section.questions.map((q) => {
            if (q.type === "textarea") {
              return (
                <TextArea
                  key={q.id}
                  id={q.id}
                  label={q.label}
                  required={q.required}
                  placeholder={q.placeholder}
                  value={answers[q.id] ?? ""}
                  onChange={(v) => updateAnswer(q.id, v)}
                  error={errors[q.id]}
                />
              );
            }
            if (q.type === "radio" && q.options) {
              return (
                <RadioGroup
                  key={q.id}
                  name={q.id}
                  label={q.label}
                  required={q.required}
                  options={q.options}
                  value={answers[q.id] ?? ""}
                  onChange={(v) => updateAnswer(q.id, v)}
                  error={errors[q.id]}
                />
              );
            }
            return (
              <TextField
                key={q.id}
                id={q.id}
                label={q.label}
                required={q.required}
                type="text"
                placeholder={q.placeholder}
                value={answers[q.id] ?? ""}
                onChange={(v) => updateAnswer(q.id, v)}
                error={errors[q.id]}
              />
            );
          })}
        </div>
      </div>

      {/* Sticky bottom nav bar — always thumb-reachable on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream-base border-t border-taupe-line px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0}>
            Back
          </Button>
          <Button onClick={handleContinue}>{isLastStep ? "Review Answers" : "Continue"}</Button>
        </div>
      </div>
    </main>
  );
}
