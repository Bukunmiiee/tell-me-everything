import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream-base">
      <div className="w-full max-w-md text-center py-16">
        <div className="mb-8 flex justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B1F2A" strokeWidth="1.5">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2 5 5.5 5c2 0 3.5 1.2 4.5 2.8C11 6.2 12.5 5 14.5 5 18 5 19.5 8.4 22 11.9 19.5 16.4 12 21 12 21z" />
          </svg>
        </div>

        <h1 className="font-display text-[32px] leading-tight text-ink mb-4">
          I&apos;d rather know now<br />than wonder later.
        </h1>

        <p className="text-ink-soft text-[16px] leading-relaxed mb-10">
          A few honest questions. No perfect answers — just yours.
        </p>

        <Link href="/questionnaire">
          <Button className="w-full sm:w-auto">I&apos;m Ready</Button>
        </Link>

        <p className="mt-10 text-[13px] text-ink-soft leading-relaxed">
          Takes about 10 minutes. Your answers are private and only
          used by me to understand whether we might be compatible.
        </p>
      </div>
    </main>
  );
}
