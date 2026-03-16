import type { Province } from "@/lib/tax/canadianTax";

// ─── planData shape (stored as JSON in FinancialPlan.planData) ─────────────

export interface PlanProfile {
  name: string;
  dob: string; // ISO date string
  partnerName?: string | null;
  partnerDob?: string | null;
  retirementTargetAge: number;
  deathAge: number; // default 100
  amountToDieWith: number; // default 100_000
  inflationRate: number; // decimal, e.g. 0.03
  investmentReturnRate: number; // decimal, e.g. 0.06
}

export interface IncomeSource {
  id: string;
  owner: "primary" | "partner";
  label: string;
  annualAmount: number;
  growthRate: number; // decimal, e.g. 0.03
  taxable: boolean;
  /** Optional: age at which this income stops (e.g. retirement) */
  endsAtAge?: number;
}

export interface ExpenseCategory {
  id: string;
  label: string;
  monthlyAmount: number;
  growthRate: number; // decimal — defaults to inflation
}

export interface CashAccount {
  id: string;
  owner: "primary" | "partner";
  label: string;
  balance: number;
}

export interface InvestmentAccount {
  id: string;
  owner: "primary" | "partner";
  type: "TFSA" | "RRSP" | "NonRegistered";
  label: string;
  balance: number;
  annualContribution: number;
  expectedReturnRate: number; // decimal
}

export interface RealEstateProperty {
  id: string;
  label: string;
  type: "PrimaryResidence" | "RentalProperty" | "VacationProperty";
  currentMarketValue: number;
  mortgageBalance: number;
  mortgageInterestRate: number; // decimal
  monthlyMortgagePayment: number;
  annualAppreciationRate: number; // decimal, default 0.02
  planToSell: boolean;
  plannedSaleYear?: number;
  sellingCostRate?: number; // decimal, default 0.05
}

export interface Debt {
  id: string;
  label: string;
  balance: number;
  interestRate: number; // decimal
  monthlyPayment: number;
}

export interface BusinessAsset {
  id: string;
  label: string;
  currentValue: number;
  annualGrowthRate: number; // decimal
  planToExit: boolean;
  exitYear?: number;
  expectedExitProceeds?: number;
}

export interface CryptoAsset {
  id: string;
  label: string;
  currentValue: number;
  annualGrowthRate: number; // decimal
}

export interface RetirementExpense {
  id: string;
  label: string;
  monthlyAmount: number;
}

export interface PlanData {
  profile: PlanProfile;
  income: IncomeSource[];
  expenses: ExpenseCategory[];
  cashAccounts: CashAccount[];
  investmentAccounts: InvestmentAccount[];
  realEstate: RealEstateProperty[];
  debts: Debt[];
  businessAssets: BusinessAsset[];
  cryptoAssets: CryptoAsset[];
  retirementExpenses: RetirementExpense[];
  /** Investment return rate expected in retirement (decimal) */
  retirementReturnRate?: number; // default 0.06
  /** Flat estimated tax rate in retirement (decimal) */
  retirementTaxRate?: number; // default 0.25
}

// ─── UserProfile fields passed into calculateModel ────────────────────────────

export interface UserProfileInput {
  province: Province;
  planType: "INDIVIDUAL" | "COUPLE";
}

// ─── Model output types ──────────────────────────────────────────────────────

export interface InvestmentAccountSnapshot {
  id: string;
  type: "TFSA" | "RRSP" | "NonRegistered";
  owner: "primary" | "partner";
  balance: number;
  contributionThisYear: number;
  growthThisYear: number;
}

export interface RealEstateSnapshot {
  id: string;
  label: string;
  marketValue: number;
  mortgageBalance: number;
  equity: number;
  sold: boolean;
  saleProceeds?: number;
}

export interface BusinessAssetSnapshot {
  id: string;
  label: string;
  value: number;
  exited: boolean;
  exitProceeds?: number;
}

export interface DebtSnapshot {
  id: string;
  label: string;
  balance: number;
}

export interface YearlySnapshot {
  year: number;
  age: number;
  partnerAge?: number;

  // Income
  grossIncome: number;
  incomeTax: number;
  afterTaxIncome: number;

  // Expenses
  totalExpenses: number;
  mortgagePayments: number;
  debtPayments: number;
  totalSpending: number;

  // Net Cash Flow
  netCashFlow: number;

  // Cash
  cashBalance: number;

  // Investments
  investmentAccounts: InvestmentAccountSnapshot[];
  totalInvestments: number;

  // Real Estate
  realEstate: RealEstateSnapshot[];
  totalRealEstateEquity: number;

  // Business
  businessAssets: BusinessAssetSnapshot[];
  totalBusinessValue: number;

  // Crypto
  cryptoValue: number;

  // Debts
  debts: DebtSnapshot[];
  totalDebt: number;

  // Total equity
  totalEquity: number;

  // Retirement readiness
  retirementPVRequired: number;
  canRetire: boolean;
}

export interface ModelOutput {
  snapshots: YearlySnapshot[];
  firstRetirementYear: number | null;
  firstRetirementAge: number | null;
}
