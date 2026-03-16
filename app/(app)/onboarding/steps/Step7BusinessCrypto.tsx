"use client";

import { CurrencyInput } from "@/components/onboarding/CurrencyInput";
import { PercentInput } from "@/components/onboarding/PercentInput";
import { ToggleCards } from "@/components/onboarding/ToggleCards";
import type { BusinessCryptoData } from "@/lib/schemas/onboarding";

interface Props {
  data: BusinessCryptoData;
  onChange: (data: BusinessCryptoData) => void;
  errors: Record<string, string>;
}

export function Step7BusinessCrypto({ data, onChange }: Props) {
  const biz = data.business;
  const crypto = data.crypto;

  const updateBiz = (patch: Partial<BusinessCryptoData["business"]>) =>
    onChange({ ...data, business: { ...biz, ...patch } });

  const updateCrypto = (patch: Partial<BusinessCryptoData["crypto"]>) =>
    onChange({ ...data, crypto: { ...crypto, ...patch } });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Business &amp; Other Assets</h2>
        <p className="mt-1 text-sm text-gray-500">
          These are less common — skip if they don&apos;t apply.
        </p>
      </div>

      {/* Business */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">Do you own equity in a business?</h3>
        <ToggleCards
          value={biz.ownsBusiness ? "yes" : "no"}
          onChange={(v) => updateBiz({ ownsBusiness: v === "yes" })}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ]}
        />

        {biz.ownsBusiness && (
          <div className="card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                id="businessValue"
                label="Estimated current value"
                value={biz.businessValue}
                onChange={(v) => updateBiz({ businessValue: v })}
              />
              <PercentInput
                id="businessGrowthRate"
                label="Expected annual growth rate"
                value={biz.businessGrowthRate}
                onChange={(v) => updateBiz({ businessGrowthRate: v })}
                helpText="Default: 5%"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => updateBiz({ planToSellBusiness: !biz.planToSellBusiness })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  biz.planToSellBusiness ? "bg-teal" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    biz.planToSellBusiness ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">I plan to exit/sell the business</span>
            </label>

            {biz.planToSellBusiness && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-14">
                <div>
                  <label className="label">Planned exit year</label>
                  <input
                    type="number"
                    min={new Date().getFullYear()}
                    value={biz.plannedExitYear || ""}
                    onChange={(e) => updateBiz({ plannedExitYear: parseInt(e.target.value) || undefined })}
                    className="input"
                    placeholder={`e.g. ${new Date().getFullYear() + 5}`}
                  />
                </div>
                <CurrencyInput
                  id="expectedSaleProceeds"
                  label="Expected sale proceeds"
                  value={biz.expectedSaleProceeds || 0}
                  onChange={(v) => updateBiz({ expectedSaleProceeds: v })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Crypto */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">Do you hold any cryptocurrency?</h3>
        <ToggleCards
          value={crypto.holdsCrypto ? "yes" : "no"}
          onChange={(v) => updateCrypto({ holdsCrypto: v === "yes" })}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
          ]}
        />

        {crypto.holdsCrypto && (
          <div className="card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                id="cryptoValue"
                label="Total current value"
                value={crypto.totalValue}
                onChange={(v) => updateCrypto({ totalValue: v })}
              />
              <PercentInput
                id="cryptoGrowthRate"
                label="Expected annual growth rate"
                value={crypto.expectedGrowthRate}
                onChange={(v) => updateCrypto({ expectedGrowthRate: v })}
                helpText="Default: 5% — crypto is volatile, use conservatively"
              />
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
              Cryptocurrency is highly volatile. Consider using a conservative estimate.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
