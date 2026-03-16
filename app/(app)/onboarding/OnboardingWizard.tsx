"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import {
  profileSchema,
  incomeSchema,
  expensesSchema,
  debtSchema,
  realEstateSchema,
  businessCryptoSchema,
  retirementSchema,
  TOTAL_STEPS,
  STEP_NAMES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_RETIREMENT_EXPENSES,
  type OnboardingState,
  type ProfileData,
  type IncomeData,
  type ExpensesData,
  type SavingsData,
  type DebtData,
  type RealEstateData,
  type BusinessCryptoData,
  type RetirementData,
} from "@/lib/schemas/onboarding";
import {
  trackOnboardingStep,
  trackOnboardingCompleted,
} from "@/lib/analytics/events";
import { saveOnboardingData, updateOnboardingStep } from "./actions";

import { Step1Profile } from "./steps/Step1Profile";
import { Step2Income } from "./steps/Step2Income";
import { Step3Expenses } from "./steps/Step3Expenses";
import { Step4Savings } from "./steps/Step4Savings";
import { Step5Debt } from "./steps/Step5Debt";
import { Step6RealEstate } from "./steps/Step6RealEstate";
import { Step7BusinessCrypto } from "./steps/Step7BusinessCrypto";
import { Step8Retirement } from "./steps/Step8Retirement";
import { Step9Review } from "./steps/Step9Review";

interface Props {
  user: User;
}

// ─── Default state ───────────────────────────────────────────────────────────

function getDefaultState(): OnboardingState {
  return {
    profile: {
      planType: "INDIVIDUAL",
      firstName: "",
      dateOfBirth: "",
      province: "ON" as const,
      partnerName: "",
      partnerDateOfBirth: "",
      retirementTargetAge: 65,
      deathAge: 100,
      amountToDieWith: 100000,
    },
    income: {
      employmentIncome: 0,
      employmentGrowthRate: 3,
      partnerEmploymentIncome: 0,
      partnerEmploymentGrowthRate: 3,
      additionalSources: [],
    },
    expenses: {
      categories: DEFAULT_EXPENSE_CATEGORIES,
      expenseGrowthRate: 3,
      hasMortgage: false,
      mortgageMonthlyPayment: 0,
    },
    savings: {
      tfsa: { enabled: false, currentBalance: 0, annualContribution: 0, expectedReturnRate: 7 },
      rrsp: { enabled: false, currentBalance: 0, annualContribution: 0, expectedReturnRate: 7 },
      nonRegistered: { enabled: false, currentBalance: 0, annualContribution: 0, expectedReturnRate: 7 },
    },
    debt: { hasDebt: false, debts: [] },
    realEstate: { ownsRealEstate: false, properties: [] },
    businessCrypto: {
      business: {
        ownsBusiness: false,
        businessValue: 0,
        businessGrowthRate: 5,
        planToSellBusiness: false,
      },
      crypto: { holdsCrypto: false, totalValue: 0, expectedGrowthRate: 5 },
    },
    retirement: {
      expenses: DEFAULT_RETIREMENT_EXPENSES,
      investmentReturnRate: 6,
      expectedTaxRate: 25,
    },
    review: { consentToMarketing: false },
  };
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export function OnboardingWizard({ user }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(getDefaultState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const startTime = useRef(Date.now());

  // ── Step validation ────────────────────────────────────────────────────

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      let result;
      switch (stepIndex) {
        case 0:
          result = profileSchema.safeParse(state.profile);
          break;
        case 1:
          result = incomeSchema.safeParse(state.income);
          break;
        case 2:
          result = expensesSchema.safeParse(state.expenses);
          break;
        // Steps 3-7: less strict — toggle-based, always valid
        case 3:
          return true;
        case 4:
          result = debtSchema.safeParse(state.debt);
          break;
        case 5:
          result = realEstateSchema.safeParse(state.realEstate);
          break;
        case 6:
          result = businessCryptoSchema.safeParse(state.businessCrypto);
          break;
        case 7:
          result = retirementSchema.safeParse(state.retirement);
          break;
        case 8:
          return true; // Review — no validation needed
        default:
          return true;
      }
      if (!result || result.success) {
        setErrors({});
        return true;
      }
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        errs[e.path.join(".")] = e.message;
      });
      setErrors(errs);
      return false;
    },
    [state]
  );

  // ── Navigation ─────────────────────────────────────────────────────────

  async function handleContinue() {
    if (!validateStep(step)) return;

    // Track engagement
    trackOnboardingStep({
      userId: user.id,
      step: step + 1,
      stepName: STEP_NAMES[step],
    });
    try {
      await updateOnboardingStep(step + 1);
    } catch {
      // Non-critical — don't block progression
    }

    if (step < TOTAL_STEPS - 1) {
      setDirection("forward");
      setStep((s) => s + 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (step > 0) {
      setDirection("back");
      setStep((s) => s - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleEditFromReview(targetStep: number) {
    setDirection("back");
    setStep(targetStep);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSaving(true);
    try {
      const elapsed = Date.now() - startTime.current;
      trackOnboardingCompleted({ userId: user.id, timeToCompleteMs: elapsed });

      await saveOnboardingData(state);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Failed to save onboarding data:", err);
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <ProgressBar currentStep={step} />

      {/* Step content with slide animation */}
      <div
        key={step}
        className={`animate-slide-${direction === "forward" ? "left" : "right"}`}
      >
        {step === 0 && (
          <Step1Profile
            data={state.profile}
            onChange={(d: ProfileData) => setState((s) => ({ ...s, profile: d }))}
            errors={errors}
          />
        )}
        {step === 1 && (
          <Step2Income
            data={state.income}
            profile={state.profile}
            onChange={(d: IncomeData) => setState((s) => ({ ...s, income: d }))}
            errors={errors}
          />
        )}
        {step === 2 && (
          <Step3Expenses
            data={state.expenses}
            onChange={(d: ExpensesData) => setState((s) => ({ ...s, expenses: d }))}
            errors={errors}
          />
        )}
        {step === 3 && (
          <Step4Savings
            data={state.savings}
            profile={state.profile}
            onChange={(d: SavingsData) => setState((s) => ({ ...s, savings: d }))}
            errors={errors}
          />
        )}
        {step === 4 && (
          <Step5Debt
            data={state.debt}
            onChange={(d: DebtData) => setState((s) => ({ ...s, debt: d }))}
            errors={errors}
          />
        )}
        {step === 5 && (
          <Step6RealEstate
            data={state.realEstate}
            onChange={(d: RealEstateData) => setState((s) => ({ ...s, realEstate: d }))}
            errors={errors}
          />
        )}
        {step === 6 && (
          <Step7BusinessCrypto
            data={state.businessCrypto}
            onChange={(d: BusinessCryptoData) => setState((s) => ({ ...s, businessCrypto: d }))}
            errors={errors}
          />
        )}
        {step === 7 && (
          <Step8Retirement
            data={state.retirement}
            onChange={(d: RetirementData) => setState((s) => ({ ...s, retirement: d }))}
            errors={errors}
          />
        )}
        {step === 8 && (
          <Step9Review
            state={state}
            onEdit={handleEditFromReview}
            consentToMarketing={state.review.consentToMarketing}
            onConsentChange={(v) =>
              setState((s) => ({ ...s, review: { consentToMarketing: v } }))
            }
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className={`btn-secondary ${step === 0 ? "invisible" : ""}`}
        >
          ← Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary text-base px-8 py-3"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Building your plan…
              </span>
            ) : (
              "Build My Plan →"
            )}
          </button>
        ) : (
          <button type="button" onClick={handleContinue} className="btn-primary">
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
