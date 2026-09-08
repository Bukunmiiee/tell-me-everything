"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DECISION_OPTIONS, DecisionChoice } from "@/lib/decisions";
import { getEmailTemplate } from "@/lib/email-templates";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApplicationStatus } from "@/lib/status";

export function DecisionPanel({
  applicationId,
  currentStatus,
  applicantName,
  applicantEmail,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
  applicantName: string;
  applicantEmail: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<DecisionChoice | null>(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ emailSent: boolean } | null>(null);

  function handleSelect(choice: DecisionChoice) {
    setSelected(choice);
    setConfirmed(null);
    const template = getEmailTemplate(choice, { name: applicantName });
    setSubject(template.subject);
    setEmailBody(template.body);
    // Default the toggle on only if they gave an email — no point offering it otherwise.
    setSendEmail(Boolean(applicantEmail));
  }

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          choice: selected,
          send_email: sendEmail && Boolean(applicantEmail),
          email_subject: subject,
          email_body: emailBody,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Couldn't save that decision. Please try again.");
        setSubmitting(false);
        return;
      }

      setConfirmed({ emailSent: data.emailSent });
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-taupe-line rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-[18px] text-ink">Decision</h2>
        <StatusBadge status={currentStatus} />
      </div>
      <p className="text-[13px] text-ink-soft mb-5">
        Take your time with this one — it updates their status right away.
      </p>

      <div className="space-y-2 mb-5">
        {DECISION_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                isSelected
                  ? "border-wine-primary bg-blush-light"
                  : "border-taupe-line bg-white hover:bg-cream-alt"
              }`}
            >
              <p className="text-[15px] text-ink font-medium">{opt.label}</p>
              <p className="text-[13px] text-ink-soft">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border-t border-taupe-line pt-5 mb-5">
          <label className="flex items-center gap-2 text-[14px] text-ink mb-4">
            <input
              type="checkbox"
              checked={sendEmail}
              disabled={!applicantEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 accent-wine-primary"
            />
            Send them an update
            {!applicantEmail && (
              <span className="text-[12px] text-ink-soft italic">
                (no email address on file)
              </span>
            )}
          </label>

          {sendEmail && applicantEmail && (
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-ink-soft mb-1">To</label>
                <p className="text-[14px] text-ink-soft">{applicantEmail}</p>
              </div>
              <div>
                <label className="block text-[12px] text-ink-soft mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-md border border-taupe-line bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-wine-primary/20 focus:border-wine-primary"
                />
              </div>
              <div>
                <label className="block text-[12px] text-ink-soft mb-1">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={7}
                  className="w-full rounded-md border border-taupe-line bg-white px-3 py-2 text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-wine-primary/20 focus:border-wine-primary"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[13px] italic text-wine-primary mb-3">{error}</p>}
      {confirmed && (
        <p className="text-[13px] text-success-sage mb-3">
          Decision saved{confirmed.emailSent ? " and email sent." : "."}
          {sendEmail && applicantEmail && !confirmed.emailSent && " (Email did not send — check your Resend setup.)"}
        </p>
      )}

      <Button onClick={handleConfirm} disabled={!selected || submitting}>
        {submitting ? "Saving…" : "Confirm Decision"}
      </Button>
    </div>
  );
}
