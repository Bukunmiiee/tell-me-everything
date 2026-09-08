"use client";

import { useEffect, useState } from "react";

export default function SubmittedPage() {
  const [statusUrl, setStatusUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("tme_status_token");
    if (token) {
      setStatusUrl(`${window.location.origin}/status/${token}`);
      // Token has done its job for this session — no need to keep it around
      // in localStorage once the user has seen it.
      window.localStorage.removeItem("tme_status_token");
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream-base">
      <div className="w-full max-w-md text-center py-16">
        <div className="mb-8 flex justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2 5 5.5 5c2 0 3.5 1.2 4.5 2.8C11 6.2 12.5 5 14.5 5 18 5 19.5 8.4 22 11.9 19.5 16.4 12 21 12 21z" />
          </svg>
        </div>

        <h1 className="font-display text-[26px] text-ink mb-4">
          That&apos;s everything.
        </h1>
        <p className="text-ink-soft text-[16px] leading-relaxed mb-8">
          Thank you for being honest with me.
        </p>

        {statusUrl && (
          <div className="bg-white border border-taupe-line rounded-xl p-5 text-left">
            <p className="text-[13px] text-ink-soft mb-2">
              Bookmark this link to check back anytime:
            </p>
            <a
              href={statusUrl}
              className="text-[14px] text-wine-primary break-all hover:underline"
            >
              {statusUrl}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
