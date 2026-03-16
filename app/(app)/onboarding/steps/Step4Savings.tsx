"use client";

import { CurrencyInput } from "@/components/onboarding/CurrencyInput";
import { PercentInput } from "@/components/onboarding/PercentInput";
import type { SavingsData, ProfileData } from "@/lib/schemas/onboarding";
import { z } from "zod";

const accountTypes = [
  { key: "tfsa" as const, label: "TFSA", desc: "Tax-Free Savings Account" },
  { key: "rrsp" as const, label: "RRSP", desc: "Registered Retirement Savings Plan" },
  { key: "nonRegistered" as const, label: "Non-Registered", desc: "Taxable investment account" },
] as const;

type AccountKey = "tfsa" | "rrsp" | "nonRegistered";
type PartnerAccountKey = "partnerTfsa" | "partnerRrsp" | "partnerNonRegistered";

const accountSchema = z.object({
  enabled: z.boolean(),
  currentBalance: z.number(),
  annualContribution: z.number(),
  expectedReturnRate: z.number(),
});

type AccountData = z.infer<typeof accountSchema>;

interface Props {
  data: SavingsData;
  profile: ProfileData;
  onChange: (data: SavingsData) => void;
  errors: Record<string, string>;
}

export function Step4Savings({ data, profile, onChange }: Props) {
  const isCouple = profile.planType === "COUPLE";

  function toggleAccount(key: AccountKey | PartnerAccountKey) {
    const current = data[key] || { enabled: false, currentBalance: 0, annualContribution: 0, expectedReturnRate: 7 };
    onChange({ ...data, [key]: { ...current, enabled: !current.enabled } });
  }

  function updateAccount(key: AccountKey | PartnerAccountKey, patch: Partial<AccountData>) {
    const current = data[key] || { enabled: false, currentBalance: 0, annualContribution: 0, expectedReturnRate: 7 };
    onChange({ ...data, [key]: { ...current, ...patch } });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Savings &amp; Investments</h2>
        <p className="mt-1 text-sm text-gray-500">
          Which accounts do you have? Toggle on the ones that apply.
        </p>
      </div>

      {/* Your accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">{profile.firstName || "Your"}&apos;s Accounts</h3>
        {accountTypes.map(({ key, label, desc }) => (
          <AccountCard
            key={key}
            label={label}
            description={desc}
            account={data[key]}
            onToggle={() => toggleAccount(key)}
            onUpdate={(patch) => updateAccount(key, patch)}
          />
        ))}
      </div>

      {/* Partner accounts */}
      {isCouple && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">{profile.partnerName || "Partner"}&apos;s Accounts</h3>
          {accountTypes.map(({ key, label, desc }) => {
            const partnerKey = `partner${key.charAt(0).toUpperCase()}${key.slice(1)}` as PartnerAccountKey;
            return (
              <AccountCard
                key={partnerKey}
                label={label}
                description={desc}
                account={data[partnerKey]}
                onToggle={() => toggleAccount(partnerKey)}
                onUpdate={(patch) => updateAccount(partnerKey, patch)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccountCard({
  label,
  description,
  account,
  onToggle,
  onUpdate,
}: {
  label: string;
  description: string;
  account: AccountData | undefined;
  onToggle: () => void;
  onUpdate: (patch: Partial<AccountData>) => void;
}) {
  const enabled = account?.enabled ?? false;

  return (
    <div className={`card transition-all ${enabled ? "ring-2 ring-teal/20 border-teal/30" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-teal" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <CurrencyInput
            id={`${label}-balance`}
            label="Current balance"
            value={account?.currentBalance ?? 0}
            onChange={(v) => onUpdate({ currentBalance: v })}
          />
          <CurrencyInput
            id={`${label}-contribution`}
            label="Annual contribution"
            value={account?.annualContribution ?? 0}
            onChange={(v) => onUpdate({ annualContribution: v })}
          />
          <PercentInput
            id={`${label}-return`}
            label="Expected return rate"
            value={account?.expectedReturnRate ?? 7}
            onChange={(v) => onUpdate({ expectedReturnRate: v })}
            helpText="Default: 7%"
          />
        </div>
      )}
    </div>
  );
}
