import { z } from "zod";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const currencyAmount = z.number().min(0, "Amount must be positive");
const percentRate = z.number().min(0).max(100, "Rate must be 0–100");
const positiveInt = z.number().int().min(0);

// ─── Step 1: Profile ─────────────────────────────────────────────────────────

export const profileSchema = z
  .object({
    planType: z.enum(["INDIVIDUAL", "COUPLE"]),
    firstName: z.string().min(1, "First name is required").max(50),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    province: z.enum(["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "PEI", "NL"], {
      required_error: "Province is required",
    }),
    partnerName: z.string().max(50).optional().default(""),
    partnerDateOfBirth: z.string().optional().default(""),
    retirementTargetAge: z.number().int().min(30).max(100, "Must be 30–100"),
    deathAge: z.number().int().min(60).max(120, "Must be 60–120").default(100),
    amountToDieWith: currencyAmount.default(100000),
  })
  .refine(
    (data) => {
      if (data.planType === "COUPLE") {
        return data.partnerName && data.partnerName.length > 0;
      }
      return true;
    },
    { message: "Partner name is required for a couple plan", path: ["partnerName"] }
  )
  .refine(
    (data) => {
      if (data.planType === "COUPLE") {
        return data.partnerDateOfBirth && data.partnerDateOfBirth.length > 0;
      }
      return true;
    },
    { message: "Partner date of birth is required", path: ["partnerDateOfBirth"] }
  );

export type ProfileData = z.infer<typeof profileSchema>;

// ─── Step 2: Income ──────────────────────────────────────────────────────────

export const incomeSourceSchema = z.object({
  id: z.string(),
  person: z.enum(["self", "partner"]),
  label: z.string().min(1, "Label is required"),
  annualAmount: currencyAmount,
  growthRate: percentRate.default(3),
  taxable: z.boolean().default(true),
});

export const incomeSchema = z.object({
  employmentIncome: currencyAmount,
  employmentGrowthRate: percentRate.default(3),
  partnerEmploymentIncome: currencyAmount.optional().default(0),
  partnerEmploymentGrowthRate: percentRate.optional().default(3),
  additionalSources: z.array(incomeSourceSchema).default([]),
});

export type IncomeData = z.infer<typeof incomeSchema>;
export type IncomeSource = z.infer<typeof incomeSourceSchema>;

// ─── Step 3: Living Expenses ─────────────────────────────────────────────────

export const expenseCategorySchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  monthlyAmount: currencyAmount,
});

export const expensesSchema = z.object({
  categories: z.array(expenseCategorySchema).min(1, "Add at least one expense category"),
  expenseGrowthRate: percentRate.default(3),
  hasMortgage: z.boolean().default(false),
  mortgageMonthlyPayment: currencyAmount.optional().default(0),
});

export type ExpensesData = z.infer<typeof expensesSchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

// ─── Step 4: Savings & Investment Accounts ───────────────────────────────────

export const investmentAccountSchema = z.object({
  enabled: z.boolean().default(false),
  currentBalance: currencyAmount.default(0),
  annualContribution: currencyAmount.default(0),
  expectedReturnRate: percentRate.default(7),
});

export const savingsSchema = z.object({
  tfsa: investmentAccountSchema.default({}),
  rrsp: investmentAccountSchema.default({}),
  nonRegistered: investmentAccountSchema.default({}),
  partnerTfsa: investmentAccountSchema.optional(),
  partnerRrsp: investmentAccountSchema.optional(),
  partnerNonRegistered: investmentAccountSchema.optional(),
});

export type SavingsData = z.infer<typeof savingsSchema>;

// ─── Step 5: Debt ────────────────────────────────────────────────────────────

export const debtItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  currentBalance: currencyAmount,
  interestRate: percentRate,
  monthlyPayment: currencyAmount,
});

export const debtSchema = z.object({
  hasDebt: z.boolean().default(false),
  debts: z.array(debtItemSchema).default([]),
});

export type DebtData = z.infer<typeof debtSchema>;
export type DebtItem = z.infer<typeof debtItemSchema>;

// ─── Step 6: Real Estate ─────────────────────────────────────────────────────

export const propertySchema = z.object({
  id: z.string(),
  type: z.enum(["PRIMARY_RESIDENCE", "RENTAL", "VACATION"]),
  currentMarketValue: currencyAmount,
  outstandingMortgage: currencyAmount.default(0),
  mortgageInterestRate: percentRate.default(5),
  monthlyMortgagePayment: currencyAmount.default(0),
  annualAppreciationRate: percentRate.default(2),
  planToSell: z.boolean().default(false),
  plannedSaleYear: z.number().int().optional(),
  estimatedSellingCostPercent: percentRate.default(5),
});

export const realEstateSchema = z.object({
  ownsRealEstate: z.boolean().default(false),
  properties: z.array(propertySchema).default([]),
});

export type RealEstateData = z.infer<typeof realEstateSchema>;
export type Property = z.infer<typeof propertySchema>;

// ─── Step 7: Business & Crypto ───────────────────────────────────────────────

export const businessSchema = z.object({
  ownsBusiness: z.boolean().default(false),
  businessValue: currencyAmount.default(0),
  businessGrowthRate: percentRate.default(5),
  planToSellBusiness: z.boolean().default(false),
  plannedExitYear: z.number().int().optional(),
  expectedSaleProceeds: currencyAmount.optional(),
});

export const cryptoSchema = z.object({
  holdsCrypto: z.boolean().default(false),
  totalValue: currencyAmount.default(0),
  expectedGrowthRate: percentRate.default(5),
});

export const businessCryptoSchema = z.object({
  business: businessSchema.default({}),
  crypto: cryptoSchema.default({}),
});

export type BusinessCryptoData = z.infer<typeof businessCryptoSchema>;

// ─── Step 8: Retirement Lifestyle ────────────────────────────────────────────

export const retirementExpenseSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  monthlyAmount: currencyAmount,
});

export const retirementSchema = z.object({
  expenses: z.array(retirementExpenseSchema).min(1, "Add at least one category"),
  investmentReturnRate: percentRate.default(6),
  expectedTaxRate: percentRate.default(25),
});

export type RetirementData = z.infer<typeof retirementSchema>;

// ─── Step 9: Review (consent) ────────────────────────────────────────────────

export const reviewSchema = z.object({
  consentToMarketing: z.boolean().default(false),
});

export type ReviewData = z.infer<typeof reviewSchema>;

// ─── Full wizard state ───────────────────────────────────────────────────────

export interface OnboardingState {
  profile: ProfileData;
  income: IncomeData;
  expenses: ExpensesData;
  savings: SavingsData;
  debt: DebtData;
  realEstate: RealEstateData;
  businessCrypto: BusinessCryptoData;
  retirement: RetirementData;
  review: ReviewData;
}

export const STEP_NAMES = [
  "Profile Setup",
  "Income",
  "Living Expenses",
  "Savings & Investments",
  "Debt",
  "Real Estate",
  "Business & Other Assets",
  "Retirement Lifestyle",
  "Review & Confirm",
] as const;

export const TOTAL_STEPS = STEP_NAMES.length;

// ─── Default categories ─────────────────────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "housing", label: "Housing (rent/utilities)", monthlyAmount: 0 },
  { id: "food", label: "Food", monthlyAmount: 0 },
  { id: "transportation", label: "Transportation", monthlyAmount: 0 },
  { id: "travel", label: "Travel", monthlyAmount: 0 },
  { id: "entertainment", label: "Entertainment", monthlyAmount: 0 },
  { id: "personal-care", label: "Personal Care", monthlyAmount: 0 },
  { id: "supporting-family", label: "Supporting Family", monthlyAmount: 0 },
  { id: "other", label: "Other", monthlyAmount: 0 },
];

export const DEFAULT_RETIREMENT_EXPENSES: RetirementData["expenses"] = [
  { id: "r-housing", label: "Housing", monthlyAmount: 0 },
  { id: "r-food", label: "Food", monthlyAmount: 0 },
  { id: "r-transportation", label: "Transportation", monthlyAmount: 0 },
  { id: "r-travel", label: "Travel", monthlyAmount: 0 },
  { id: "r-healthcare", label: "Healthcare", monthlyAmount: 0 },
  { id: "r-entertainment", label: "Entertainment", monthlyAmount: 0 },
  { id: "r-gifts", label: "Gifts & Family", monthlyAmount: 0 },
  { id: "r-other", label: "Other", monthlyAmount: 0 },
];

export const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "QC", label: "Quebec" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "PEI", label: "Prince Edward Island" },
  { value: "NL", label: "Newfoundland & Labrador" },
] as const;
