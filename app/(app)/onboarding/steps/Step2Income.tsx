"use client";

import { CurrencyInput } from "@/components/onboarding/CurrencyInput";
import { PercentInput } from "@/components/onboarding/PercentInput";
import type { IncomeData, IncomeSource, ProfileData } from "@/lib/schemas/onboarding";

interface Props {
  data: IncomeData;
  profile: ProfileData;
  onChange: (data: IncomeData) => void;
  errors: Record<string, string>;
}

export function Step2Income({ data, profile, onChange, errors }: Props) {
  const isCouple = profile.planType === "COUPLE";
  const update = (patch: Partial<IncomeData>) => onChange({ ...data, ...patch });

  function addSource(person: "self" | "partner") {
    const newSource: IncomeSource = {
      id: crypto.randomUUID(),
      person,
      label: "",
      annualAmount: 0,
      growthRate: 3,
      taxable: true,
    };
    update({ additionalSources: [...data.additionalSources, newSource] });
  }

  function updateSource(id: string, patch: Partial<IncomeSource>) {
    update({
      additionalSources: data.additionalSources.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  }

  function removeSource(id: string) {
    update({
      additionalSources: data.additionalSources.filter((s) => s.id !== id),
    });
  }

  const selfSources = data.additionalSources.filter((s) => s.person === "self");
  const partnerSources = data.additionalSources.filter((s) => s.person === "partner");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Income</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about your current income sources.
        </p>
      </div>

      {/* Your employment */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">
          {profile.firstName || "Your"}&apos;s Employment Income
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            id="employmentIncome"
            label="Annual employment income (pre-tax)"
            value={data.employmentIncome}
            onChange={(v) => update({ employmentIncome: v })}
            error={errors.employmentIncome}
          />
          <PercentInput
            id="employmentGrowthRate"
            label="Expected annual growth rate"
            value={data.employmentGrowthRate}
            onChange={(v) => update({ employmentGrowthRate: v })}
            helpText="Default: 3%"
          />
        </div>
      </div>

      {/* Partner employment */}
      {isCouple && (
        <div className="card space-y-4 border-teal/20 bg-teal/5">
          <h3 className="font-semibold text-gray-900">
            {profile.partnerName || "Partner"}&apos;s Employment Income
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              id="partnerEmploymentIncome"
              label="Annual employment income (pre-tax)"
              value={data.partnerEmploymentIncome || 0}
              onChange={(v) => update({ partnerEmploymentIncome: v })}
            />
            <PercentInput
              id="partnerEmploymentGrowthRate"
              label="Expected annual growth rate"
              value={data.partnerEmploymentGrowthRate || 3}
              onChange={(v) => update({ partnerEmploymentGrowthRate: v })}
              helpText="Default: 3%"
            />
          </div>
        </div>
      )}

      {/* Additional sources — self */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-700">Other income sources ({profile.firstName || "You"})</p>
          <button type="button" onClick={() => addSource("self")} className="btn-secondary text-xs px-3 py-1.5">
            + Add source
          </button>
        </div>
        {selfSources.length === 0 && (
          <p className="text-sm text-gray-400">No additional income sources yet.</p>
        )}
        {selfSources.map((source) => (
          <IncomeSourceRow key={source.id} source={source} onUpdate={updateSource} onRemove={removeSource} />
        ))}
      </div>

      {/* Additional sources — partner */}
      {isCouple && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-700">Other income sources ({profile.partnerName || "Partner"})</p>
            <button type="button" onClick={() => addSource("partner")} className="btn-secondary text-xs px-3 py-1.5">
              + Add source
            </button>
          </div>
          {partnerSources.length === 0 && (
            <p className="text-sm text-gray-400">No additional income sources yet.</p>
          )}
          {partnerSources.map((source) => (
            <IncomeSourceRow key={source.id} source={source} onUpdate={updateSource} onRemove={removeSource} />
          ))}
        </div>
      )}
    </div>
  );
}

function IncomeSourceRow({
  source,
  onUpdate,
  onRemove,
}: {
  source: IncomeSource;
  onUpdate: (id: string, patch: Partial<IncomeSource>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="card flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[140px]">
        <label className="label">Type</label>
        <select
          value={source.label}
          onChange={(e) => onUpdate(source.id, { label: e.target.value })}
          className="input"
        >
          <option value="">Select…</option>
          <option value="Rental Income">Rental Income</option>
          <option value="Business Income">Business Income</option>
          <option value="Dividends">Dividends</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="w-36">
        <CurrencyInput
          id={`amt-${source.id}`}
          label="Annual amount"
          value={source.annualAmount}
          onChange={(v) => onUpdate(source.id, { annualAmount: v })}
        />
      </div>
      <div className="flex items-end gap-2">
        <label className="flex items-center gap-1.5 text-sm text-gray-600 pb-2">
          <input
            type="checkbox"
            checked={source.taxable}
            onChange={(e) => onUpdate(source.id, { taxable: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal"
          />
          Taxable
        </label>
        <button
          type="button"
          onClick={() => onRemove(source.id)}
          className="mb-1 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
