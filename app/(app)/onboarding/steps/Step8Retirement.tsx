"use client";

import { PercentInput } from "@/components/onboarding/PercentInput";
import type { RetirementData } from "@/lib/schemas/onboarding";

interface Props {
  data: RetirementData;
  onChange: (data: RetirementData) => void;
  errors: Record<string, string>;
}

export function Step8Retirement({ data, onChange, errors }: Props) {
  const update = (patch: Partial<RetirementData>) => onChange({ ...data, ...patch });

  function updateExpense(id: string, patch: Partial<RetirementData["expenses"][0]>) {
    update({
      expenses: data.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  function addExpense() {
    update({
      expenses: [
        ...data.expenses,
        { id: crypto.randomUUID(), label: "", monthlyAmount: 0 },
      ],
    });
  }

  function removeExpense(id: string) {
    update({ expenses: data.expenses.filter((e) => e.id !== id) });
  }

  const totalMonthly = data.expenses.reduce((sum, e) => sum + e.monthlyAmount, 0);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Retirement Lifestyle</h2>
        <p className="mt-1 text-sm text-gray-500">
          What will your life cost in retirement? Enter amounts in today&apos;s dollars — the model adjusts for inflation.
        </p>
      </div>

      {/* Expense items */}
      <div className="space-y-3">
        {data.expenses.map((exp) => (
          <div key={exp.id} className="flex items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              {exp.id === data.expenses[0]?.id && <label className="label">Category</label>}
              <input
                type="text"
                value={exp.label}
                onChange={(e) => updateExpense(exp.id, { label: e.target.value })}
                className="input"
                placeholder="Category name"
              />
            </div>
            <div className="w-40">
              {exp.id === data.expenses[0]?.id && <label className="label">Monthly ($)</label>}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min={0}
                  value={exp.monthlyAmount || ""}
                  onChange={(e) => updateExpense(exp.id, { monthlyAmount: parseFloat(e.target.value) || 0 })}
                  className="input pl-7"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="w-32 pb-0.5">
              {exp.id === data.expenses[0]?.id && <label className="label">Yearly</label>}
              <p className="input bg-gray-50 text-gray-500 border-gray-100">
                ${(exp.monthlyAmount * 12).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeExpense(exp.id)}
              className="mb-1 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <button type="button" onClick={addExpense} className="btn-secondary text-xs px-3 py-1.5">
          + Add category
        </button>
        {errors.expenses && <p className="text-xs text-red-500">{errors.expenses}</p>}
      </div>

      {/* Totals */}
      <div className="card bg-gray-50 flex items-center justify-between">
        <span className="font-medium text-gray-700">Total retirement expenses</span>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${totalYearly.toLocaleString()}<span className="text-sm text-gray-400 font-normal">/year</span>
          </p>
          <p className="text-xs text-gray-400">${totalMonthly.toLocaleString()}/month (today&apos;s dollars)</p>
        </div>
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PercentInput
          id="retirementReturnRate"
          label="Investment return rate in retirement"
          value={data.investmentReturnRate}
          onChange={(v) => update({ investmentReturnRate: v })}
          helpText="Default: 6% — usually lower due to conservative allocation"
        />
        <PercentInput
          id="retirementTaxRate"
          label="Expected tax rate in retirement"
          value={data.expectedTaxRate}
          onChange={(v) => update({ expectedTaxRate: v })}
          helpText="Flat estimate. Default: 25%"
        />
      </div>
    </div>
  );
}
