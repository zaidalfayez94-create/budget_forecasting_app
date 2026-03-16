"use client";

interface PercentInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  helpText?: string;
}

export function PercentInput({
  id,
  label,
  value,
  onChange,
  error,
  helpText,
}: PercentInputProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`input pr-8 ${error ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
          placeholder="0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          %
        </span>
      </div>
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
