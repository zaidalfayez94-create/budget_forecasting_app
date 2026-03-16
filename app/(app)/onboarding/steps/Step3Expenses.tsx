"use client";

import { CurrencyInput } from "@/components/onboarding/CurrencyInput";
import { PercentInput } from "@/components/onboarding/PercentInput";
import type { ExpensesData, ExpenseCategory } from "@/lib/schemas/onboarding";

interface Props {
  data: ExpensesData;
  onChange: (data: ExpensesData) => void;
  errors: Record<string, string>;
}

export function Step3Expenses({ data, onChange, errors }: Props) {
  const update = (patch: Partial<ExpensesData>) => onChange({ ...data, ...patch });

  function updateCategory(id: string, patch: Partial<ExpenseCategory>) {
    update({
      categories: data.categories.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  }

  function addCategory() {
    const newCat: ExpenseCategory = {
      id: crypto.randomUUID(),
      label: "",
      monthlyAmount: 0,
    };
    update({ categories: [...data.categories, newCat] });
  }

  function removeCategory(id: string) {
    update({ categories: data.categories.filter((c) => c.id !== id) });
  }

  const totalMonthly = data.categories.reduce((sum, c) => sum + c.monthlyAmount, 0);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Living Expenses</h2>
        <p className="mt-1 text-sm text-gray-500">
          What does your current life cost? We&apos;ll use this to project your pre-retirement spending.
        </p>
      </div>

      {/* Expense categories */}
      <div className="space-y-3">
        {data.categories.map((cat) => (
          <div key={cat.id} className="flex items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              {cat.id === data.categories[0]?.id && <label className="label">Category</label>}
              <input
                type="text"
                value={cat.label}
                onChange={(e) => updateCategory(cat.id, { label: e.target.value })}
                className="input"
                placeholder="Category name"
              />
            </div>
            <div className="w-40">
              {cat.id === data.categories[0]?.id && <label className="label">Monthly ($)</label>}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min={0}
                  value={cat.monthlyAmount || ""}
                  onChange={(e) => updateCategory(cat.id, { monthlyAmount: parseFloat(e.target.value) || 0 })}
                  className="input pl-7"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="w-32 pb-0.5">
              {cat.id === data.categories[0]?.id && <label className="label">Yearly</label>}
              <p className="input bg-gray-50 text-gray-500 border-gray-100">
                ${(cat.monthlyAmount * 12).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeCategory(cat.id)}
              className="mb-1 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <button type="button" onClick={addCategory} className="btn-secondary text-xs px-3 py-1.5">
          + Add category
        </button>
        {errors.categories && <p className="text-xs text-red-500">{errors.categories}</p>}
      </div>

      {/* Totals */}
      <div className="card bg-gray-50 flex items-center justify-between">
        <span className="font-medium text-gray-700">Total living expenses</span>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${totalYearly.toLocaleString()}<span className="text-sm text-gray-400 font-normal">/year</span>
          </p>
          <p className="text-xs text-gray-400">${totalMonthly.toLocaleString()}/month</p>
        </div>
      </div>

      {/* Growth rate */}
      <div className="max-w-xs">
        <PercentInput
          id="expenseGrowthRate"
          label="Expected annual expense growth rate"
          value={data.expenseGrowthRate}
          onChange={(v) => update({ expenseGrowthRate: v })}
          helpText="Usually tracks inflation (~3%)"
        />
      </div>

      {/* Mortgage */}
      <div className="card space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => update({ hasMortgage: !data.hasMortgage })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              data.hasMortgage ? "bg-teal" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                data.hasMortgage ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
          <span className="font-medium text-gray-700">I have a mortgage payment</span>
        </label>
        {data.hasMortgage && (
          <div className="max-w-xs">
            <CurrencyInput
              id="mortgageMonthlyPayment"
              label="Monthly mortgage payment"
              value={data.mortgageMonthlyPayment || 0}
              onChange={(v) => update({ mortgageMonthlyPayment: v })}
              helpText="This will be linked to your property in Step 6."
            />
          </div>
        )}
      </div>
    </div>
  );
}
