interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  required,
  placeholder = "Take your time — there's no perfect answer here.",
  error,
}: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] text-ink-soft mb-1.5">
        {label}
        {required && <span className="text-wine-primary"> *</span>}
      </label>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className={`w-full rounded-md border bg-white px-4 py-3 text-[16px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-wine-primary/20 focus:border-wine-primary ${
          error ? "border-wine-primary" : "border-taupe-line"
        }`}
      />
      {error && <p className="mt-1 text-[13px] italic text-wine-primary">{error}</p>}
    </div>
  );
}
