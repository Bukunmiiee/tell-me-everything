interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  error?: string;
}

export function RadioGroup({ label, name, value, onChange, options, required, error }: Props) {
  return (
    <fieldset>
      <legend className="block text-[13px] text-ink-soft mb-2">
        {label}
        {required && <span className="text-wine-primary"> *</span>}
      </legend>
      <div className="flex gap-3">
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-2 rounded-md border px-4 py-3 cursor-pointer text-[15px] transition-colors ${
                checked
                  ? "border-wine-primary bg-blush-light"
                  : "border-taupe-line bg-white hover:bg-cream-alt"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  checked ? "border-wine-primary" : "border-taupe-line"
                }`}
              >
                {checked && <span className="h-2.5 w-2.5 rounded-full bg-wine-primary" />}
              </span>
              {opt.label}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1 text-[13px] italic text-wine-primary">{error}</p>}
    </fieldset>
  );
}
