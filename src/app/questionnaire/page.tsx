import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TOTAL_SECTIONS } from "@/lib/questions";

export default function QuestionnaireIntroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-cream-base">
      <div className="w-full max-w-md text-center py-16">
        <h1 className="font-display text-[26px] text-ink mb-4">Before we start</h1>
        <p className="text-ink-soft text-[16px] leading-relaxed mb-3">
          There are {TOTAL_SECTIONS} short sections. Nothing here is a trick question —
          I&apos;d rather hear the honest answer than the impressive one.
        </p>
        <p className="text-ink-soft text-[16px] leading-relaxed mb-10">
          You can leave and come back — your answers save automatically on this device
          as you go.
        </p>
        <Link href="/questionnaire/form">
          <Button className="w-full sm:w-auto">Begin</Button>
        </Link>
      </div>
    </main>
  );
}
