"use client";

interface ToggleOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ToggleCardsProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ToggleCards({ options, value, onChange }: ToggleCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              relative flex flex-col items-center justify-center rounded-xl border-2 p-6 transition-all
              ${
                selected
                  ? "border-teal bg-teal/5 ring-2 ring-teal/20"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            {opt.icon && (
              <div className={`mb-2 ${selected ? "text-teal" : "text-gray-400"}`}>
                {opt.icon}
              </div>
            )}
            <span
              className={`text-sm font-semibold ${
                selected ? "text-teal-dark" : "text-gray-700"
              }`}
            >
              {opt.label}
            </span>
            {opt.description && (
              <span className="mt-1 text-xs text-gray-400">{opt.description}</span>
            )}
            {selected && (
              <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
