"use client";

import type { OnboardingState } from "@/lib/schemas/onboarding";
import { PROVINCES, STEP_NAMES } from "@/lib/schemas/onboarding";

interface Props {
  state: OnboardingState;
  onEdit: (step: number) => void;
  consentToMarketing: boolean;
  onConsentChange: (v: boolean) => void;
}

export function Step9Review({ state, onEdit, consentToMarketing, onConsentChange }: Props) {
  const { profile, income, expenses, savings, debt, realEstate, businessCrypto, retirement } = state;

  const provinceName = PROVINCES.find((p) => p.value === profile.province)?.label ?? profile.province;
  const totalExpenses = expenses.categories.reduce((s, c) => s + c.monthlyAmount * 12, 0);
  const totalRetirement = retirement.expenses.reduce((s, e) => s + e.monthlyAmount * 12, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review Your Plan</h2>
        <p className="mt-1 text-sm text-gray-500">
          Check everything looks right. Click &quot;Edit&quot; to make changes.
        </p>
      </div>

      {/* Profile */}
      <ReviewSection title={STEP_NAMES[0]} onEdit={() => onEdit(0)}>
        <Row label="Plan type" value={profile.planType === "COUPLE" ? "Couple" : "Individual"} />
        <Row label="Name" value={profile.firstName} />
        <Row label="Date of birth" value={profile.dateOfBirth} />
        <Row label="Province" value={provinceName} />
        {profile.planType === "COUPLE" && (
          <>
            <Row label="Partner" value={profile.partnerName || "—"} />
            <Row label="Partner DOB" value={profile.partnerDateOfBirth || "—"} />
          </>
        )}
        <Row label="Target retirement age" value={String(profile.retirementTargetAge)} />
        <Row label="Project until age" value={String(profile.deathAge)} />
        <Row label="Leave behind" value={`$${profile.amountToDieWith.toLocaleString()}`} />
      </ReviewSection>

      {/* Income */}
      <ReviewSection title={STEP_NAMES[1]} onEdit={() => onEdit(1)}>
        <Row label="Employment income" value={`$${income.employmentIncome.toLocaleString()}/yr`} />
        <Row label="Growth rate" value={`${income.employmentGrowthRate}%`} />
        {profile.planType === "COUPLE" && (
          <Row label="Partner income" value={`$${(income.partnerEmploymentIncome || 0).toLocaleString()}/yr`} />
        )}
        {income.additionalSources.length > 0 && (
          <Row label="Other sources" value={`${income.additionalSources.length} added`} />
        )}
      </ReviewSection>

      {/* Expenses */}
      <ReviewSection title={STEP_NAMES[2]} onEdit={() => onEdit(2)}>
        <Row label="Total living expenses" value={`$${totalExpenses.toLocaleString()}/yr`} />
        <Row label="Expense growth rate" value={`${expenses.expenseGrowthRate}%`} />
        {expenses.hasMortgage && (
          <Row label="Mortgage payment" value={`$${(expenses.mortgageMonthlyPayment || 0).toLocaleString()}/mo`} />
        )}
      </ReviewSection>

      {/* Savings */}
      <ReviewSection title={STEP_NAMES[3]} onEdit={() => onEdit(3)}>
        {savings.tfsa.enabled && (
          <Row label="TFSA balance" value={`$${savings.tfsa.currentBalance.toLocaleString()}`} />
        )}
        {savings.rrsp.enabled && (
          <Row label="RRSP balance" value={`$${savings.rrsp.currentBalance.toLocaleString()}`} />
        )}
        {savings.nonRegistered.enabled && (
          <Row label="Non-registered" value={`$${savings.nonRegistered.currentBalance.toLocaleString()}`} />
        )}
        {!savings.tfsa.enabled && !savings.rrsp.enabled && !savings.nonRegistered.enabled && (
          <Row label="Accounts" value="None" />
        )}
      </ReviewSection>

      {/* Debt */}
      <ReviewSection title={STEP_NAMES[4]} onEdit={() => onEdit(4)}>
        {debt.hasDebt ? (
          <Row label="Debts" value={`${debt.debts.length} item(s) — $${debt.debts.reduce((s, d) => s + d.currentBalance, 0).toLocaleString()} total`} />
        ) : (
          <Row label="Debt" value="None" />
        )}
      </ReviewSection>

      {/* Real Estate */}
      <ReviewSection title={STEP_NAMES[5]} onEdit={() => onEdit(5)}>
        {realEstate.ownsRealEstate ? (
          <Row label="Properties" value={`${realEstate.properties.length} — $${realEstate.properties.reduce((s, p) => s + p.currentMarketValue, 0).toLocaleString()} total value`} />
        ) : (
          <Row label="Real estate" value="None" />
        )}
      </ReviewSection>

      {/* Business & Crypto */}
      <ReviewSection title={STEP_NAMES[6]} onEdit={() => onEdit(6)}>
        <Row
          label="Business"
          value={businessCrypto.business.ownsBusiness ? `$${businessCrypto.business.businessValue.toLocaleString()}` : "None"}
        />
        <Row
          label="Crypto"
          value={businessCrypto.crypto.holdsCrypto ? `$${businessCrypto.crypto.totalValue.toLocaleString()}` : "None"}
        />
      </ReviewSection>

      {/* Retirement */}
      <ReviewSection title={STEP_NAMES[7]} onEdit={() => onEdit(7)}>
        <Row label="Retirement expenses" value={`$${totalRetirement.toLocaleString()}/yr`} />
        <Row label="Return rate" value={`${retirement.investmentReturnRate}%`} />
        <Row label="Tax rate" value={`${retirement.expectedTaxRate}%`} />
      </ReviewSection>

      {/* Consent */}
      <div className="card border-gray-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentToMarketing}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-teal focus:ring-teal"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I agree to Clearpath using my anonymized demographic information (province, age range,
            relationship status) to improve the product and for occasional relevant outreach.
            You can change this in Settings at any time.
          </span>
        </label>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-teal hover:text-teal-dark"
        >
          Edit
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
