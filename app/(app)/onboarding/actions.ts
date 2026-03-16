"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { OnboardingState } from "@/lib/schemas/onboarding";

export async function saveOnboardingData(state: OnboardingState) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { profile, income, expenses, savings, debt, realEstate, businessCrypto, retirement, review } = state;

  // ── 1. Upsert User row ──────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email! },
    update: { email: user.email! },
  });

  // ── 2. Upsert UserProfile ───────────────────────────────────────────────
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      firstName: profile.firstName,
      dateOfBirth: new Date(profile.dateOfBirth),
      province: profile.province,
      planType: profile.planType,
      partnerDateOfBirth:
        profile.planType === "COUPLE" && profile.partnerDateOfBirth
          ? new Date(profile.partnerDateOfBirth)
          : null,
      consentToMarketing: review.consentToMarketing,
      consentDate: review.consentToMarketing ? new Date() : null,
    },
    update: {
      firstName: profile.firstName,
      dateOfBirth: new Date(profile.dateOfBirth),
      province: profile.province,
      planType: profile.planType,
      partnerDateOfBirth:
        profile.planType === "COUPLE" && profile.partnerDateOfBirth
          ? new Date(profile.partnerDateOfBirth)
          : null,
      consentToMarketing: review.consentToMarketing,
      consentDate: review.consentToMarketing ? new Date() : null,
    },
  });

  // ── 3. Upsert UserEngagement ────────────────────────────────────────────
  await prisma.userEngagement.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      onboardingStepReached: 9,
      onboardingCompletedAt: new Date(),
      lastActiveAt: new Date(),
      totalSessions: 1,
    },
    update: {
      onboardingStepReached: 9,
      onboardingCompletedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  // ── 4. Build planData JSON ──────────────────────────────────────────────
  const planData = {
    profile: {
      name: profile.firstName,
      dob: profile.dateOfBirth,
      partnerName: profile.planType === "COUPLE" ? profile.partnerName : null,
      partnerDob: profile.planType === "COUPLE" ? profile.partnerDateOfBirth : null,
      retirementTargetAge: profile.retirementTargetAge,
      deathAge: profile.deathAge,
      amountToDieWith: profile.amountToDieWith,
      inflationRate: expenses.expenseGrowthRate,
      investmentReturnRate: retirement.investmentReturnRate,
    },
    income: [
      {
        person: "self",
        label: "Employment",
        annualAmount: income.employmentIncome,
        growthRate: income.employmentGrowthRate,
        taxable: true,
      },
      ...(profile.planType === "COUPLE"
        ? [
            {
              person: "partner",
              label: "Employment",
              annualAmount: income.partnerEmploymentIncome ?? 0,
              growthRate: income.partnerEmploymentGrowthRate ?? 3,
              taxable: true,
            },
          ]
        : []),
      ...income.additionalSources.map((s) => ({
        person: s.person,
        label: s.label,
        annualAmount: s.annualAmount,
        growthRate: s.growthRate,
        taxable: s.taxable,
      })),
    ],
    expenses: expenses.categories.map((c) => ({
      label: c.label,
      monthlyAmount: c.monthlyAmount,
      yearlyAmount: c.monthlyAmount * 12,
    })),
    cashAccounts: [],
    investmentAccounts: buildInvestmentAccounts(savings, profile.planType),
    realEstate: realEstate.ownsRealEstate
      ? realEstate.properties.map((p) => ({
          type: p.type,
          currentMarketValue: p.currentMarketValue,
          outstandingMortgage: p.outstandingMortgage,
          mortgageInterestRate: p.mortgageInterestRate,
          monthlyMortgagePayment: p.monthlyMortgagePayment,
          annualAppreciationRate: p.annualAppreciationRate,
          planToSell: p.planToSell,
          plannedSaleYear: p.plannedSaleYear,
          estimatedSellingCostPercent: p.estimatedSellingCostPercent,
        }))
      : [],
    debts: debt.hasDebt
      ? debt.debts.map((d) => ({
          label: d.label,
          currentBalance: d.currentBalance,
          interestRate: d.interestRate,
          monthlyPayment: d.monthlyPayment,
        }))
      : [],
    businessAssets: businessCrypto.business.ownsBusiness
      ? [
          {
            currentValue: businessCrypto.business.businessValue,
            growthRate: businessCrypto.business.businessGrowthRate,
            planToSell: businessCrypto.business.planToSellBusiness,
            plannedExitYear: businessCrypto.business.plannedExitYear,
            expectedSaleProceeds: businessCrypto.business.expectedSaleProceeds,
          },
        ]
      : [],
    cryptoAssets: businessCrypto.crypto.holdsCrypto
      ? [
          {
            totalValue: businessCrypto.crypto.totalValue,
            expectedGrowthRate: businessCrypto.crypto.expectedGrowthRate,
          },
        ]
      : [],
    retirementExpenses: retirement.expenses.map((e) => ({
      label: e.label,
      monthlyAmount: e.monthlyAmount,
      yearlyAmount: e.monthlyAmount * 12,
    })),
  };

  // ── 5. Create FinancialPlan ─────────────────────────────────────────────
  // Delete any existing base plan for this user first
  await prisma.financialPlan.deleteMany({
    where: { userId: user.id, isBasePlan: true },
  });

  const plan = await prisma.financialPlan.create({
    data: {
      userId: user.id,
      name: `${profile.firstName}'s Plan`,
      isBasePlan: true,
      planData,
      modelOutput: Prisma.JsonNull, // Will be populated after model calculation
      firstRetirementAge: null,
      targetRetirementAge: profile.retirementTargetAge,
    },
  });

  return { planId: plan.id };
}

// ── Helper to update onboarding step reached ────────────────────────────────

export async function updateOnboardingStep(step: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Ensure user + engagement rows exist
  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email! },
    update: {},
  });

  const existing = await prisma.userEngagement.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    // Only update if the new step is higher
    if (step > existing.onboardingStepReached) {
      await prisma.userEngagement.update({
        where: { userId: user.id },
        data: {
          onboardingStepReached: step,
          lastActiveAt: new Date(),
        },
      });
    } else {
      await prisma.userEngagement.update({
        where: { userId: user.id },
        data: { lastActiveAt: new Date() },
      });
    }
  } else {
    await prisma.userEngagement.create({
      data: {
        userId: user.id,
        onboardingStepReached: step,
        lastActiveAt: new Date(),
        totalSessions: 1,
      },
    });
  }
}

// ── Build investment accounts array for planData ────────────────────────────

function buildInvestmentAccounts(
  savings: OnboardingState["savings"],
  planType: string
) {
  const accounts: Array<{
    person: string;
    type: string;
    currentBalance: number;
    annualContribution: number;
    expectedReturnRate: number;
  }> = [];

  if (savings.tfsa.enabled) {
    accounts.push({
      person: "self",
      type: "TFSA",
      currentBalance: savings.tfsa.currentBalance,
      annualContribution: savings.tfsa.annualContribution,
      expectedReturnRate: savings.tfsa.expectedReturnRate,
    });
  }
  if (savings.rrsp.enabled) {
    accounts.push({
      person: "self",
      type: "RRSP",
      currentBalance: savings.rrsp.currentBalance,
      annualContribution: savings.rrsp.annualContribution,
      expectedReturnRate: savings.rrsp.expectedReturnRate,
    });
  }
  if (savings.nonRegistered.enabled) {
    accounts.push({
      person: "self",
      type: "NON_REGISTERED",
      currentBalance: savings.nonRegistered.currentBalance,
      annualContribution: savings.nonRegistered.annualContribution,
      expectedReturnRate: savings.nonRegistered.expectedReturnRate,
    });
  }

  if (planType === "COUPLE") {
    if (savings.partnerTfsa?.enabled) {
      accounts.push({
        person: "partner",
        type: "TFSA",
        currentBalance: savings.partnerTfsa.currentBalance,
        annualContribution: savings.partnerTfsa.annualContribution,
        expectedReturnRate: savings.partnerTfsa.expectedReturnRate,
      });
    }
    if (savings.partnerRrsp?.enabled) {
      accounts.push({
        person: "partner",
        type: "RRSP",
        currentBalance: savings.partnerRrsp.currentBalance,
        annualContribution: savings.partnerRrsp.annualContribution,
        expectedReturnRate: savings.partnerRrsp.expectedReturnRate,
      });
    }
    if (savings.partnerNonRegistered?.enabled) {
      accounts.push({
        person: "partner",
        type: "NON_REGISTERED",
        currentBalance: savings.partnerNonRegistered.currentBalance,
        annualContribution: savings.partnerNonRegistered.annualContribution,
        expectedReturnRate: savings.partnerNonRegistered.expectedReturnRate,
      });
    }
  }

  return accounts;
}
