"use client";

interface CurrencyInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  error?: string;
  helpText?: string;
}

export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  placeholder = "0",
  error,
  helpText,
}: CurrencyInputProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          $
        </span>
        <input
          id={id}
          type="number"
          min={0}
          step="any"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`input pl-7 ${error ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
          placeholder={placeholder}
        />
      </div>
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
