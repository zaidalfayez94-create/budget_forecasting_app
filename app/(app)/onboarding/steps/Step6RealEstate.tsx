"use client";

import { CurrencyInput } from "@/components/onboarding/CurrencyInput";
import { PercentInput } from "@/components/onboarding/PercentInput";
import { ToggleCards } from "@/components/onboarding/ToggleCards";
import type { RealEstateData, Property } from "@/lib/schemas/onboarding";

interface Props {
  data: RealEstateData;
  onChange: (data: RealEstateData) => void;
  errors: Record<string, string>;
}

const propertyTypes = [
  { value: "PRIMARY_RESIDENCE", label: "Primary Residence" },
  { value: "RENTAL", label: "Rental Property" },
  { value: "VACATION", label: "Vacation Property" },
];

export function Step6RealEstate({ data, onChange }: Props) {
  const update = (patch: Partial<RealEstateData>) => onChange({ ...data, ...patch });

  function addProperty() {
    const prop: Property = {
      id: crypto.randomUUID(),
      type: "PRIMARY_RESIDENCE",
      currentMarketValue: 0,
      outstandingMortgage: 0,
      mortgageInterestRate: 5,
      monthlyMortgagePayment: 0,
      annualAppreciationRate: 2,
      planToSell: false,
      estimatedSellingCostPercent: 5,
    };
    update({ properties: [...data.properties, prop] });
  }

  function updateProperty(id: string, patch: Partial<Property>) {
    update({
      properties: data.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  function removeProperty(id: string) {
    update({ properties: data.properties.filter((p) => p.id !== id) });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Real Estate</h2>
        <p className="mt-1 text-sm text-gray-500">
          Do you own any real estate?
        </p>
      </div>

      <ToggleCards
        value={data.ownsRealEstate ? "yes" : "no"}
        onChange={(v) => update({ ownsRealEstate: v === "yes" })}
        options={[
          { value: "no", label: "No, I don't own property" },
          { value: "yes", label: "Yes, I own property" },
        ]}
      />

      {data.ownsRealEstate && (
        <div className="space-y-6">
          {data.properties.map((prop, idx) => (
            <div key={prop.id} className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Property {idx + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeProperty(prop.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Property type */}
              <div>
                <label className="label">Property type</label>
                <select
                  value={prop.type}
                  onChange={(e) => updateProperty(prop.id, { type: e.target.value as Property["type"] })}
                  className="input max-w-xs"
                >
                  {propertyTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyInput
                  id={`prop-value-${prop.id}`}
                  label="Current market value"
                  value={prop.currentMarketValue}
                  onChange={(v) => updateProperty(prop.id, { currentMarketValue: v })}
                />
                <CurrencyInput
                  id={`prop-mortgage-${prop.id}`}
                  label="Outstanding mortgage"
                  value={prop.outstandingMortgage}
                  onChange={(v) => updateProperty(prop.id, { outstandingMortgage: v })}
                />
                <PercentInput
                  id={`prop-rate-${prop.id}`}
                  label="Mortgage interest rate"
                  value={prop.mortgageInterestRate}
                  onChange={(v) => updateProperty(prop.id, { mortgageInterestRate: v })}
                />
                <CurrencyInput
                  id={`prop-payment-${prop.id}`}
                  label="Monthly mortgage payment"
                  value={prop.monthlyMortgagePayment}
                  onChange={(v) => updateProperty(prop.id, { monthlyMortgagePayment: v })}
                />
                <PercentInput
                  id={`prop-appreciation-${prop.id}`}
                  label="Annual appreciation rate"
                  value={prop.annualAppreciationRate}
                  onChange={(v) => updateProperty(prop.id, { annualAppreciationRate: v })}
                  helpText="Default: 2%"
                />
              </div>

              {/* Plan to sell */}
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => updateProperty(prop.id, { planToSell: !prop.planToSell })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      prop.planToSell ? "bg-teal" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        prop.planToSell ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700">I plan to sell this property</span>
                </label>

                {prop.planToSell && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 ml-14">
                    <div>
                      <label className="label">Planned sale year</label>
                      <input
                        type="number"
                        min={new Date().getFullYear()}
                        value={prop.plannedSaleYear || ""}
                        onChange={(e) =>
                          updateProperty(prop.id, { plannedSaleYear: parseInt(e.target.value) || undefined })
                        }
                        className="input"
                        placeholder={`e.g. ${new Date().getFullYear() + 10}`}
                      />
                    </div>
                    <PercentInput
                      id={`prop-sell-cost-${prop.id}`}
                      label="Estimated selling costs"
                      value={prop.estimatedSellingCostPercent}
                      onChange={(v) => updateProperty(prop.id, { estimatedSellingCostPercent: v })}
                      helpText="Default: 5% of value at time of sale"
                    />
                    {prop.type !== "PRIMARY_RESIDENCE" && (
                      <p className="sm:col-span-2 text-xs text-gray-400">
                        Capital gains tax will be calculated at the 50% inclusion rate (Canadian rules). Primary residences are exempt.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button type="button" onClick={addProperty} className="btn-secondary text-sm">
            + Add another property
          </button>
        </div>
      )}
    </div>
  );
}
