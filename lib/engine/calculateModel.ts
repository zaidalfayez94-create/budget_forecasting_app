/**
 * Clearpath — Core Financial Model Calculation Engine
 *
 * Pure TypeScript module. Takes a PlanData JSON blob + UserProfile fields
 * and returns year-by-year projections until the user (or younger partner)
 * reaches the configured death age.
 */

import { calculateTax, getMarginalRate, type Province } from "@/lib/tax/canadianTax";
import type {
  PlanData,
  UserProfileInput,
  ModelOutput,
  YearlySnapshot,
  InvestmentAccountSnapshot,
  RealEstateSnapshot,
  BusinessAssetSnapshot,
  DebtSnapshot,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CASH_INTEREST_RATE = 0.0275; // 2.75% flat for cash/HISA
const DEFAULT_RETIREMENT_RETURN_RATE = 0.06;
const DEFAULT_RETIREMENT_TAX_RATE = 0.25;
const DEFAULT_SELLING_COST_RATE = 0.05;
const CAPITAL_GAINS_INCLUSION_RATE = 0.5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ageAtYear(dob: string, year: number): number {
  const birthYear = new Date(dob).getFullYear();
  return year - birthYear;
}

function currentYear(): number {
  return new Date().getFullYear();
}

// ─── Retirement PV Calculation ────────────────────────────────────────────────

/**
 * Present Value of a Growing Annuity + PV of amount to die with.
 *
 * @param annualSpendToday   Total annual retirement spend in today's dollars
 * @param inflationRate      g
 * @param returnRate         r (retirement return rate)
 * @param retirementTaxRate  Flat estimated tax rate in retirement
 * @param yearsFromNow       How many years from today until retirement starts
 * @param yearsInRetirement  n = deathAge - retirementAge
 * @param amountToDieWith    Lump sum desired at death
 */
export function calculateRetirementPV(
  annualSpendToday: number,
  inflationRate: number,
  returnRate: number,
  retirementTaxRate: number,
  yearsFromNow: number,
  yearsInRetirement: number,
  amountToDieWith: number
): number {
  if (yearsInRetirement <= 0) return 0;

  const r = returnRate;
  const g = inflationRate;
  const n = yearsInRetirement;

  // Spending in year Y's dollars, grossed up for taxes
  const spendInFutureDollars =
    annualSpendToday * Math.pow(1 + g, yearsFromNow);
  const C_pretax = spendInFutureDollars / (1 - retirementTaxRate);

  // PV of growing annuity
  let pvAnnuity: number;
  if (Math.abs(r - g) < 1e-10) {
    // Edge case: r ≈ g → PV = C * n / (1 + r)
    pvAnnuity = (C_pretax * n) / (1 + r);
  } else {
    pvAnnuity = C_pretax * (1 - Math.pow((1 + g) / (1 + r), n)) / (r - g);
  }

  // PV of death amount
  const pvDeathAmount = amountToDieWith / Math.pow(1 + r, n);

  return pvAnnuity + pvDeathAmount;
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function calculateModel(
  planData: PlanData,
  profile: UserProfileInput
): ModelOutput {
  const { province, planType } = profile;
  const {
    profile: planProfile,
    income,
    expenses,
    cashAccounts,
    investmentAccounts,
    realEstate,
    debts,
    businessAssets,
    cryptoAssets,
    retirementExpenses,
  } = planData;

  const retirementReturnRate =
    planData.retirementReturnRate ?? DEFAULT_RETIREMENT_RETURN_RATE;
  const retirementTaxRate =
    planData.retirementTaxRate ?? DEFAULT_RETIREMENT_TAX_RATE;
  const inflationRate = planProfile.inflationRate;
  const deathAge = planProfile.deathAge;

  const startYear = currentYear();
  const primaryDob = planProfile.dob;
  const partnerDob = planProfile.partnerDob ?? null;
  const isCouple = planType === "COUPLE" && partnerDob !== null;

  // Determine model end year: younger person reaches death age
  const primaryEndYear = new Date(primaryDob).getFullYear() + deathAge;
  const partnerEndYear = partnerDob
    ? new Date(partnerDob).getFullYear() + deathAge
    : 0;
  const endYear = isCouple
    ? Math.max(primaryEndYear, partnerEndYear)
    : primaryEndYear;

  // Annual retirement spending in today's dollars
  const annualRetirementSpend = retirementExpenses.reduce(
    (sum, e) => sum + e.monthlyAmount * 12,
    0
  );

  // ── Mutable state that carries forward year over year ────────────────────

  let cashBalance = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

  let investmentState = investmentAccounts.map((a) => ({
    id: a.id,
    type: a.type,
    owner: a.owner,
    balance: a.balance,
    annualContribution: a.annualContribution,
    expectedReturnRate: a.expectedReturnRate,
  }));

  let realEstateState = realEstate.map((p) => ({
    ...p,
    sold: false,
    originalMarketValue: p.currentMarketValue,
    currentMarketValue: p.currentMarketValue,
    mortgageBalance: p.mortgageBalance,
  }));

  let debtState = debts.map((d) => ({
    ...d,
    balance: d.balance,
  }));

  let businessState = businessAssets.map((b) => ({
    ...b,
    value: b.currentValue,
    exited: false,
  }));

  let cryptoValue = cryptoAssets.reduce((sum, c) => sum + c.currentValue, 0);
  const cryptoGrowthRate =
    cryptoAssets.length > 0
      ? cryptoAssets.reduce((sum, c) => sum + c.annualGrowthRate * c.currentValue, 0) /
        Math.max(cryptoValue, 1)
      : 0;

  // ── Snapshots ────────────────────────────────────────────────────────────

  const snapshots: YearlySnapshot[] = [];
  let firstRetirementYear: number | null = null;
  let firstRetirementAge: number | null = null;

  for (let year = startYear; year <= endYear; year++) {
    const yearsElapsed = year - startYear;
    const age = ageAtYear(primaryDob, year);
    const partnerAge = partnerDob ? ageAtYear(partnerDob, year) : undefined;

    // ── 1. Income ──────────────────────────────────────────────────────────

    let primaryGrossIncome = 0;
    let partnerGrossIncome = 0;
    let totalGrossIncome = 0;

    for (const src of income) {
      const ownerAge = src.owner === "partner" && partnerDob
        ? ageAtYear(partnerDob, year)
        : age;
      // Stop income if past endsAtAge
      if (src.endsAtAge && ownerAge >= src.endsAtAge) continue;

      const amount = src.annualAmount * Math.pow(1 + src.growthRate, yearsElapsed);

      if (src.owner === "primary") {
        primaryGrossIncome += amount;
      } else {
        partnerGrossIncome += amount;
      }
      totalGrossIncome += amount;
    }

    // ── 2. RRSP contributions reduce taxable income ────────────────────────

    let primaryRRSPContrib = 0;
    let partnerRRSPContrib = 0;

    for (const acct of investmentState) {
      if (acct.type === "RRSP") {
        if (acct.owner === "primary") {
          primaryRRSPContrib += acct.annualContribution;
        } else {
          partnerRRSPContrib += acct.annualContribution;
        }
      }
    }

    // ── 3. Tax calculation (separate for each person in a couple) ──────────

    const primaryTaxableIncome = Math.max(
      0,
      primaryGrossIncome - primaryRRSPContrib
    );
    const primaryTax = calculateTax(primaryTaxableIncome, province);

    let partnerTax = 0;
    if (isCouple) {
      const partnerTaxableIncome = Math.max(
        0,
        partnerGrossIncome - partnerRRSPContrib
      );
      partnerTax = calculateTax(partnerTaxableIncome, province);
    }

    const totalIncomeTax = primaryTax + partnerTax;
    const afterTaxIncome = totalGrossIncome - totalIncomeTax;

    // ── 4. Expenses (grown by inflation or their own growth rate) ──────────

    let totalExpenses = 0;
    for (const exp of expenses) {
      const rate = exp.growthRate || inflationRate;
      const annual = exp.monthlyAmount * 12 * Math.pow(1 + rate, yearsElapsed);
      totalExpenses += annual;
    }

    // ── 5. Mortgage payments (only for unsold properties with balance > 0)

    let mortgagePayments = 0;
    for (const prop of realEstateState) {
      if (!prop.sold && prop.mortgageBalance > 0) {
        mortgagePayments += prop.monthlyMortgagePayment * 12;
      }
    }

    // ── 6. Debt payments (for debts with balance > 0) ──────────────────────

    let debtPayments = 0;
    for (const d of debtState) {
      if (d.balance > 0) {
        debtPayments += d.monthlyPayment * 12;
      }
    }

    const totalSpending = totalExpenses + mortgagePayments + debtPayments;
    const netCashFlow = afterTaxIncome - totalSpending;

    // ── 7. Update cash balance ─────────────────────────────────────────────

    // Interest on opening balance + net cash flow added
    const cashInterest = cashBalance * CASH_INTEREST_RATE;
    cashBalance = cashBalance + cashInterest + netCashFlow;
    if (cashBalance < 0) cashBalance = 0; // can't go negative in simple model

    // ── 8. Update investment accounts ──────────────────────────────────────

    const investmentSnapshots: InvestmentAccountSnapshot[] = [];
    for (const acct of investmentState) {
      const growth = acct.balance * acct.expectedReturnRate;
      acct.balance = acct.balance + growth + acct.annualContribution;
      if (acct.balance < 0) acct.balance = 0;

      investmentSnapshots.push({
        id: acct.id,
        type: acct.type,
        owner: acct.owner,
        balance: Math.round(acct.balance * 100) / 100,
        contributionThisYear: acct.annualContribution,
        growthThisYear: Math.round(growth * 100) / 100,
      });
    }
    const totalInvestments = investmentSnapshots.reduce(
      (sum, a) => sum + a.balance,
      0
    );

    // ── 9. Update real estate ──────────────────────────────────────────────

    const realEstateSnapshots: RealEstateSnapshot[] = [];
    for (const prop of realEstateState) {
      if (prop.sold) {
        // Already sold in a prior year — keep showing as sold
        realEstateSnapshots.push({
          id: prop.id,
          label: prop.label,
          marketValue: 0,
          mortgageBalance: 0,
          equity: 0,
          sold: true,
        });
        continue;
      }

      // Appreciate value
      prop.currentMarketValue *= 1 + prop.annualAppreciationRate;

      // Amortize mortgage
      if (prop.mortgageBalance > 0) {
        const monthlyRate = prop.mortgageInterestRate / 12;
        let remainingBalance = prop.mortgageBalance;
        for (let m = 0; m < 12; m++) {
          if (remainingBalance <= 0) break;
          const interestPayment = remainingBalance * monthlyRate;
          const principalPayment = Math.min(
            prop.monthlyMortgagePayment - interestPayment,
            remainingBalance
          );
          remainingBalance -= Math.max(0, principalPayment);
        }
        prop.mortgageBalance = Math.max(0, remainingBalance);
      }

      // Check for sale
      if (prop.planToSell && prop.plannedSaleYear && year === prop.plannedSaleYear) {
        const grossSaleValue = prop.currentMarketValue;
        const sellingCostRate = prop.sellingCostRate ?? DEFAULT_SELLING_COST_RATE;
        const sellingCosts = grossSaleValue * sellingCostRate;

        let capitalGainsTax = 0;
        if (prop.type !== "PrimaryResidence") {
          const capitalGain = Math.max(0, grossSaleValue - prop.originalMarketValue);
          const taxableGain = capitalGain * CAPITAL_GAINS_INCLUSION_RATE;
          const marginalRate = getMarginalRate(
            primaryTaxableIncome + taxableGain,
            province
          );
          capitalGainsTax = taxableGain * marginalRate;
        }

        const netProceeds = grossSaleValue - sellingCosts - capitalGainsTax - prop.mortgageBalance;
        cashBalance += Math.max(0, netProceeds);
        prop.sold = true;

        realEstateSnapshots.push({
          id: prop.id,
          label: prop.label,
          marketValue: Math.round(grossSaleValue),
          mortgageBalance: 0,
          equity: 0,
          sold: true,
          saleProceeds: Math.round(Math.max(0, netProceeds)),
        });
      } else {
        const equity = prop.currentMarketValue - prop.mortgageBalance;
        realEstateSnapshots.push({
          id: prop.id,
          label: prop.label,
          marketValue: Math.round(prop.currentMarketValue),
          mortgageBalance: Math.round(prop.mortgageBalance),
          equity: Math.round(equity),
          sold: false,
        });
      }
    }
    const totalRealEstateEquity = realEstateSnapshots.reduce(
      (sum, p) => sum + (p.sold && !p.saleProceeds ? 0 : p.equity),
      0
    );

    // ── 10. Update business assets ─────────────────────────────────────────

    const businessSnapshots: BusinessAssetSnapshot[] = [];
    for (const biz of businessState) {
      if (biz.exited) {
        businessSnapshots.push({
          id: biz.id,
          label: biz.label,
          value: 0,
          exited: true,
        });
        continue;
      }

      biz.value *= 1 + biz.annualGrowthRate;

      if (biz.planToExit && biz.exitYear && year === biz.exitYear) {
        const proceeds = biz.expectedExitProceeds ?? biz.value;
        cashBalance += proceeds;
        biz.exited = true;
        businessSnapshots.push({
          id: biz.id,
          label: biz.label,
          value: 0,
          exited: true,
          exitProceeds: Math.round(proceeds),
        });
      } else {
        businessSnapshots.push({
          id: biz.id,
          label: biz.label,
          value: Math.round(biz.value),
          exited: false,
        });
      }
    }
    const totalBusinessValue = businessSnapshots.reduce(
      (sum, b) => sum + b.value,
      0
    );

    // ── 11. Update crypto ──────────────────────────────────────────────────

    cryptoValue *= 1 + cryptoGrowthRate;

    // ── 12. Update debts (amortize) ────────────────────────────────────────

    const debtSnapshots: DebtSnapshot[] = [];
    for (const d of debtState) {
      if (d.balance <= 0) {
        debtSnapshots.push({ id: d.id, label: d.label, balance: 0 });
        continue;
      }

      const monthlyRate = d.interestRate / 12;
      let remaining = d.balance;
      for (let m = 0; m < 12; m++) {
        if (remaining <= 0) break;
        const interest = remaining * monthlyRate;
        const principal = Math.min(d.monthlyPayment - interest, remaining);
        remaining -= Math.max(0, principal);
      }
      d.balance = Math.max(0, remaining);

      debtSnapshots.push({
        id: d.id,
        label: d.label,
        balance: Math.round(d.balance),
      });
    }
    const totalDebt = debtSnapshots.reduce((sum, d) => sum + d.balance, 0);

    // ── 13. Total equity ───────────────────────────────────────────────────

    const totalEquity =
      cashBalance +
      totalInvestments +
      totalRealEstateEquity +
      totalBusinessValue +
      Math.round(cryptoValue) -
      totalDebt;

    // ── 14. Retirement PV required ─────────────────────────────────────────

    const yearsFromNow = yearsElapsed;
    const yearsInRetirement = deathAge - age;

    const retirementPVRequired =
      yearsInRetirement > 0
        ? calculateRetirementPV(
            annualRetirementSpend,
            inflationRate,
            retirementReturnRate,
            retirementTaxRate,
            yearsFromNow,
            yearsInRetirement,
            planProfile.amountToDieWith
          )
        : 0;

    const canRetire = totalEquity >= retirementPVRequired;

    if (canRetire && firstRetirementYear === null) {
      firstRetirementYear = year;
      firstRetirementAge = age;
    }

    // ── Build snapshot ─────────────────────────────────────────────────────

    snapshots.push({
      year,
      age,
      partnerAge,
      grossIncome: Math.round(totalGrossIncome),
      incomeTax: Math.round(totalIncomeTax),
      afterTaxIncome: Math.round(afterTaxIncome),
      totalExpenses: Math.round(totalExpenses),
      mortgagePayments: Math.round(mortgagePayments),
      debtPayments: Math.round(debtPayments),
      totalSpending: Math.round(totalSpending),
      netCashFlow: Math.round(netCashFlow),
      cashBalance: Math.round(cashBalance),
      investmentAccounts: investmentSnapshots,
      totalInvestments: Math.round(totalInvestments),
      realEstate: realEstateSnapshots,
      totalRealEstateEquity: Math.round(totalRealEstateEquity),
      businessAssets: businessSnapshots,
      totalBusinessValue: Math.round(totalBusinessValue),
      cryptoValue: Math.round(cryptoValue),
      debts: debtSnapshots,
      totalDebt: Math.round(totalDebt),
      totalEquity: Math.round(totalEquity),
      retirementPVRequired: Math.round(retirementPVRequired),
      canRetire,
    });
  }

  return {
    snapshots,
    firstRetirementYear,
    firstRetirementAge,
  };
}
