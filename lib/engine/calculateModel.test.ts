import { describe, it, expect } from "vitest";
import { calculateModel, calculateRetirementPV } from "./calculateModel";
import { calculateTax } from "@/lib/tax/canadianTax";
import type { PlanData, UserProfileInput } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THIS_YEAR = new Date().getFullYear();

/** Build a minimal valid PlanData with sensible defaults. */
function makePlanData(overrides: Partial<PlanData> = {}): PlanData {
  return {
    profile: {
      name: "Test User",
      dob: `${THIS_YEAR - 30}-06-15`, // 30 years old
      retirementTargetAge: 65,
      deathAge: 100,
      amountToDieWith: 100_000,
      inflationRate: 0.03,
      investmentReturnRate: 0.06,
      ...overrides.profile,
    },
    income: overrides.income ?? [],
    expenses: overrides.expenses ?? [],
    cashAccounts: overrides.cashAccounts ?? [],
    investmentAccounts: overrides.investmentAccounts ?? [],
    realEstate: overrides.realEstate ?? [],
    debts: overrides.debts ?? [],
    businessAssets: overrides.businessAssets ?? [],
    cryptoAssets: overrides.cryptoAssets ?? [],
    retirementExpenses: overrides.retirementExpenses ?? [
      { id: "r1", label: "Living expenses", monthlyAmount: 3000 },
    ],
    retirementReturnRate: overrides.retirementReturnRate,
    retirementTaxRate: overrides.retirementTaxRate,
  } as PlanData;
}

const SINGLE_PROFILE: UserProfileInput = {
  province: "ON",
  planType: "INDIVIDUAL",
};

const COUPLE_PROFILE: UserProfileInput = {
  province: "ON",
  planType: "COUPLE",
};

// ─── Test 1: Single person, no assets ─────────────────────────────────────────

describe("Test 1: Single person, no assets — equity from contributions only", () => {
  it("should grow equity purely from TFSA contributions", () => {
    const plan = makePlanData({
      income: [
        {
          id: "i1",
          owner: "primary",
          label: "Salary",
          annualAmount: 80_000,
          growthRate: 0.03,
          taxable: true,
        },
      ],
      investmentAccounts: [
        {
          id: "inv1",
          owner: "primary",
          type: "TFSA",
          label: "TFSA",
          balance: 0,
          annualContribution: 7_000,
          expectedReturnRate: 0.06,
        },
      ],
    });

    const result = calculateModel(plan, SINGLE_PROFILE);

    expect(result.snapshots.length).toBeGreaterThan(0);

    // After year 1, TFSA should have contribution + growth
    const year1 = result.snapshots[0];
    expect(year1.investmentAccounts[0].balance).toBeGreaterThan(0);
    expect(year1.investmentAccounts[0].contributionThisYear).toBe(7_000);

    // Equity should grow over time
    const year5 = result.snapshots[4];
    const year10 = result.snapshots[9];
    expect(year10.totalInvestments).toBeGreaterThan(year5.totalInvestments);
    expect(year10.totalEquity).toBeGreaterThan(year5.totalEquity);
  });
});

// ─── Test 2: Couple — taxes calculated separately ─────────────────────────────

describe("Test 2: Couple — taxes calculated separately, not on combined income", () => {
  it("combined individual tax should be ≤ tax on the sum of incomes", () => {
    const primaryIncome = 80_000;
    const partnerIncome = 60_000;
    const combinedIncome = primaryIncome + partnerIncome;

    const plan = makePlanData({
      profile: {
        name: "Primary",
        dob: `${THIS_YEAR - 35}-01-01`,
        partnerName: "Partner",
        partnerDob: `${THIS_YEAR - 33}-01-01`,
        retirementTargetAge: 65,
        deathAge: 100,
        amountToDieWith: 100_000,
        inflationRate: 0.03,
        investmentReturnRate: 0.06,
      },
      income: [
        {
          id: "i1",
          owner: "primary" as const,
          label: "Primary Salary",
          annualAmount: primaryIncome,
          growthRate: 0,
          taxable: true,
        },
        {
          id: "i2",
          owner: "partner" as const,
          label: "Partner Salary",
          annualAmount: partnerIncome,
          growthRate: 0,
          taxable: true,
        },
      ],
    });

    const result = calculateModel(plan, COUPLE_PROFILE);
    const year1 = result.snapshots[0];

    // Tax when calculated separately (what the engine does)
    const separateTax = year1.incomeTax;

    // Tax if we incorrectly combined first
    const combinedTax = calculateTax(combinedIncome, "ON");

    // Due to progressive brackets, splitting is always ≤ combining
    expect(separateTax).toBeLessThanOrEqual(combinedTax);

    // Also verify gross income is the sum
    expect(year1.grossIncome).toBe(combinedIncome);
  });
});

// ─── Test 3: Property sale — non-primary residence ────────────────────────────

describe("Test 3: Non-primary-residence property sale", () => {
  it("should deduct selling costs and capital gains tax from proceeds", () => {
    const plan = makePlanData({
      income: [
        {
          id: "i1",
          owner: "primary",
          label: "Salary",
          annualAmount: 100_000,
          growthRate: 0,
          taxable: true,
        },
      ],
      realEstate: [
        {
          id: "re1",
          label: "Rental Condo",
          type: "RentalProperty",
          currentMarketValue: 500_000,
          mortgageBalance: 200_000,
          mortgageInterestRate: 0.05,
          monthlyMortgagePayment: 1_200,
          annualAppreciationRate: 0.03,
          planToSell: true,
          plannedSaleYear: THIS_YEAR + 5,
          sellingCostRate: 0.05,
        },
      ],
    });

    const result = calculateModel(plan, SINGLE_PROFILE);

    // Find the sale year snapshot
    const saleSnapshot = result.snapshots.find((s) => s.year === THIS_YEAR + 5);
    expect(saleSnapshot).toBeDefined();

    const soldProp = saleSnapshot!.realEstate.find((r) => r.id === "re1");
    expect(soldProp).toBeDefined();
    expect(soldProp!.sold).toBe(true);
    expect(soldProp!.saleProceeds).toBeDefined();

    // Sale proceeds should be less than market value (costs + tax deducted)
    // Engine appreciates each year including sale year → 6 appreciation cycles
    // (years 0 through 5 inclusive)
    const appreciatedValue = 500_000 * Math.pow(1.03, 6);
    expect(soldProp!.saleProceeds!).toBeLessThan(appreciatedValue);
    expect(soldProp!.saleProceeds!).toBeGreaterThan(0);

    // Verify it's removed from equity in subsequent years
    const nextYear = result.snapshots.find((s) => s.year === THIS_YEAR + 6);
    const nextProp = nextYear!.realEstate.find((r) => r.id === "re1");
    expect(nextProp!.sold).toBe(true);
    expect(nextProp!.equity).toBe(0);
  });
});

// ─── Test 4: Primary residence sale — no capital gains tax ────────────────────

describe("Test 4: Primary residence sale — no capital gains tax", () => {
  it("should only deduct selling costs, not capital gains tax", () => {
    const currentValue = 800_000;
    const appreciationRate = 0.04;
    const saleYear = THIS_YEAR + 3;
    const sellingCostRate = 0.05;

    const plan = makePlanData({
      income: [
        {
          id: "i1",
          owner: "primary",
          label: "Salary",
          annualAmount: 100_000,
          growthRate: 0,
          taxable: true,
        },
      ],
      realEstate: [
        {
          id: "re1",
          label: "Home",
          type: "PrimaryResidence",
          currentMarketValue: currentValue,
          mortgageBalance: 0,
          mortgageInterestRate: 0,
          monthlyMortgagePayment: 0,
          annualAppreciationRate: appreciationRate,
          planToSell: true,
          plannedSaleYear: saleYear,
          sellingCostRate,
        },
      ],
    });

    const result = calculateModel(plan, SINGLE_PROFILE);
    const saleSnapshot = result.snapshots.find((s) => s.year === saleYear);
    const prop = saleSnapshot!.realEstate.find((r) => r.id === "re1");

    expect(prop!.sold).toBe(true);

    // Expected: value after appreciation, minus only selling costs.
    // Engine appreciates each year BEFORE checking for sale, so
    // selling in THIS_YEAR+3 = 4 appreciation cycles (years 0,1,2,3).
    const appreciatedValue = currentValue * Math.pow(1 + appreciationRate, 4);
    const expectedProceeds = appreciatedValue - appreciatedValue * sellingCostRate;

    // Should be within $100 (rounding)
    expect(Math.abs(prop!.saleProceeds! - expectedProceeds)).toBeLessThan(100);
  });
});

// ─── Test 5: Retirement PV formula verification ──────────────────────────────

describe("Test 5: Retirement PV — known inputs, expected output", () => {
  it("should produce correct PV for the Financial_Planner_2025 example", () => {
    // Inputs from the prompt:
    // $126,000/yr spend, 3% inflation, 8% return, retire at 40,
    // die at 95, $100,000 to die with
    //
    // Manual PV calculation with tax gross-up (25%):
    //   C_pretax = 126,000 / (1 - 0.25) = $168,000
    //   r = 0.08, g = 0.03, n = 55
    //   (1.03/1.08)^55 ≈ 0.07378
    //   PV_annuity = 168,000 * (1 - 0.07378) / 0.05 ≈ $3,112,051
    //   PV_death = 100,000 / 1.08^55 ≈ $2,686
    //   Total PV ≈ $3,114,737

    const annualSpend = 126_000;
    const inflationRate = 0.03;
    const returnRate = 0.08;
    const retirementTaxRate = 0.25;
    const yearsFromNow = 0;
    const yearsInRetirement = 95 - 40; // 55 years
    const amountToDieWith = 100_000;

    const pv = calculateRetirementPV(
      annualSpend,
      inflationRate,
      returnRate,
      retirementTaxRate,
      yearsFromNow,
      yearsInRetirement,
      amountToDieWith
    );

    // Verify against manual calculation — allow 1% tolerance
    const expected = 3_114_737;
    const tolerance = expected * 0.01;

    expect(pv).toBeGreaterThan(expected - tolerance);
    expect(pv).toBeLessThan(expected + tolerance);

    // Also verify individual components make sense:
    // PV should be much larger than annual spend * years (undiscounted)
    // but less than C_pretax * years (no discounting at all)
    expect(pv).toBeGreaterThan(annualSpend * 20); // sanity floor
    expect(pv).toBeLessThan(168_000 * yearsInRetirement); // sanity ceiling
  });

  it("should return 0 for 0 years in retirement", () => {
    const pv = calculateRetirementPV(50_000, 0.03, 0.06, 0.25, 0, 0, 100_000);
    expect(pv).toBe(0);
  });

  it("should handle r ≈ g edge case without NaN", () => {
    const pv = calculateRetirementPV(50_000, 0.05, 0.05, 0.25, 0, 30, 100_000);
    expect(pv).toBeGreaterThan(0);
    expect(Number.isFinite(pv)).toBe(true);
  });
});
