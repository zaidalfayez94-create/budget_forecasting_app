"use client";

import { CurrencyInput } from "@/components/onboarding/CurrencyInput";
import { PercentInput } from "@/components/onboarding/PercentInput";
import { ToggleCards } from "@/components/onboarding/ToggleCards";
import type { DebtData, DebtItem } from "@/lib/schemas/onboarding";

interface Props {
  data: DebtData;
  onChange: (data: DebtData) => void;
  errors: Record<string, string>;
}

export function Step5Debt({ data, onChange }: Props) {
  const update = (patch: Partial<DebtData>) => onChange({ ...data, ...patch });

  function addDebt() {
    const item: DebtItem = {
      id: crypto.randomUUID(),
      label: "",
      currentBalance: 0,
      interestRate: 0,
      monthlyPayment: 0,
    };
    update({ debts: [...data.debts, item] });
  }

  function updateDebt(id: string, patch: Partial<DebtItem>) {
    update({
      debts: data.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    });
  }

  function removeDebt(id: string) {
    update({ debts: data.debts.filter((d) => d.id !== id) });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Debt</h2>
        <p className="mt-1 text-sm text-gray-500">
          Do you carry any debt outside of a mortgage?
        </p>
      </div>

      <ToggleCards
        value={data.hasDebt ? "yes" : "no"}
        onChange={(v) => update({ hasDebt: v === "yes" })}
        options={[
          {
            value: "no",
            label: "No debt",
            icon: (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            value: "yes",
            label: "Yes, I have debt",
            icon: (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            ),
          },
        ]}
      />

      {data.hasDebt && (
        <div className="space-y-4">
          {data.debts.map((debt) => (
            <div key={debt.id} className="card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-xs">
                  <label className="label">Label</label>
                  <select
                    value={debt.label}
                    onChange={(e) => updateDebt(debt.id, { label: e.target.value })}
                    className="input"
                  >
                    <option value="">Select type…</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Student Loan">Student Loan</option>
                    <option value="Line of Credit">Line of Credit</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeDebt(debt.id)}
                  className="mt-5 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CurrencyInput
                  id={`debt-bal-${debt.id}`}
                  label="Current balance"
                  value={debt.currentBalance}
                  onChange={(v) => updateDebt(debt.id, { currentBalance: v })}
                />
                <PercentInput
                  id={`debt-rate-${debt.id}`}
                  label="Interest rate"
                  value={debt.interestRate}
                  onChange={(v) => updateDebt(debt.id, { interestRate: v })}
                />
                <CurrencyInput
                  id={`debt-pay-${debt.id}`}
                  label="Monthly payment"
                  value={debt.monthlyPayment}
                  onChange={(v) => updateDebt(debt.id, { monthlyPayment: v })}
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={addDebt} className="btn-secondary text-sm">
            + Add another debt
          </button>
        </div>
      )}
    </div>
  );
}
