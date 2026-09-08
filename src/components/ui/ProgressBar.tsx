interface Props {
  current: number; // 1-indexed
  total: number;
  label: string;
}

export function ProgressBar({ current, total, label }: Props) {
  const percent = Math.round((current / total) * 100);
  return (
    <div aria-live="polite">
      <div className="h-[2px] w-full bg-taupe-line rounded-full overflow-hidden">
        <div
          className="h-full bg-wine-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-[13px] text-ink-soft">
        Section {current} of {total} — {label}
      </p>
    </div>
  );
}
