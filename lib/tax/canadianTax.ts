// TODO: Update brackets each tax year. Consider moving to a config
// file or DB table to avoid requiring a code deploy for annual updates.

/**
 * Canadian Tax Calculator — 2024 Tax Year
 *
 * Calculates combined federal + provincial income tax for an individual.
 * RRSP deductions should be subtracted from gross income BEFORE calling
 * this function (i.e. pass taxableIncome = gross - RRSP contributions).
 * TFSA contributions/withdrawals are not taxable and have no effect.
 */

export type Province =
  | "ON"
  | "BC"
  | "AB"
  | "QC"
  | "MB"
  | "SK"
  | "NS"
  | "NB"
  | "PEI"
  | "NL";

// ─── Bracket structure ────────────────────────────────────────────────────────

interface TaxBracket {
  /** Upper bound of this bracket (Infinity for the top bracket) */
  upTo: number;
  /** Marginal rate as a decimal (e.g. 0.15 = 15%) */
  rate: number;
}

interface TaxSchedule {
  brackets: TaxBracket[];
  /** Basic personal amount — tax credit at lowest marginal rate */
  basicPersonalAmount: number;
}

// ─── Federal brackets (2024) ──────────────────────────────────────────────────

const FEDERAL: TaxSchedule = {
  brackets: [
    { upTo: 55_867, rate: 0.15 },
    { upTo: 111_733, rate: 0.205 },
    { upTo: 154_906, rate: 0.26 },
    { upTo: 220_000, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 },
  ],
  basicPersonalAmount: 15_705,
};

// ─── Provincial brackets (2024) ───────────────────────────────────────────────

const PROVINCIAL: Record<Province, TaxSchedule> = {
  ON: {
    brackets: [
      { upTo: 51_446, rate: 0.0505 },
      { upTo: 102_894, rate: 0.0915 },
      { upTo: 150_000, rate: 0.1116 },
      { upTo: 220_000, rate: 0.1216 },
      { upTo: Infinity, rate: 0.1316 },
    ],
    basicPersonalAmount: 11_865,
  },
  BC: {
    brackets: [
      { upTo: 45_654, rate: 0.0506 },
      { upTo: 91_310, rate: 0.077 },
      { upTo: 104_835, rate: 0.105 },
      { upTo: 127_299, rate: 0.1229 },
      { upTo: 172_602, rate: 0.147 },
      { upTo: 240_716, rate: 0.168 },
      { upTo: Infinity, rate: 0.205 },
    ],
    basicPersonalAmount: 11_981,
  },
  AB: {
    brackets: [
      { upTo: 142_292, rate: 0.1 },
      { upTo: 170_751, rate: 0.12 },
      { upTo: 227_668, rate: 0.13 },
      { upTo: 341_502, rate: 0.14 },
      { upTo: Infinity, rate: 0.15 },
    ],
    basicPersonalAmount: 21_003,
  },
  QC: {
    brackets: [
      { upTo: 51_780, rate: 0.14 },
      { upTo: 103_545, rate: 0.19 },
      { upTo: 126_000, rate: 0.24 },
      { upTo: Infinity, rate: 0.2575 },
    ],
    basicPersonalAmount: 17_183,
  },
  MB: {
    brackets: [
      { upTo: 47_000, rate: 0.108 },
      { upTo: 100_000, rate: 0.1275 },
      { upTo: Infinity, rate: 0.174 },
    ],
    basicPersonalAmount: 15_780,
  },
  SK: {
    brackets: [
      { upTo: 52_057, rate: 0.105 },
      { upTo: 148_734, rate: 0.125 },
      { upTo: Infinity, rate: 0.145 },
    ],
    basicPersonalAmount: 17_661,
  },
  NS: {
    brackets: [
      { upTo: 29_590, rate: 0.0879 },
      { upTo: 59_180, rate: 0.1495 },
      { upTo: 93_000, rate: 0.1667 },
      { upTo: 150_000, rate: 0.175 },
      { upTo: Infinity, rate: 0.21 },
    ],
    basicPersonalAmount: 8_481,
  },
  NB: {
    brackets: [
      { upTo: 47_715, rate: 0.094 },
      { upTo: 95_431, rate: 0.14 },
      { upTo: 176_756, rate: 0.16 },
      { upTo: Infinity, rate: 0.195 },
    ],
    basicPersonalAmount: 12_458,
  },
  PEI: {
    brackets: [
      { upTo: 32_656, rate: 0.098 },
      { upTo: 64_313, rate: 0.138 },
      { upTo: Infinity, rate: 0.167 },
    ],
    basicPersonalAmount: 12_000,
  },
  NL: {
    brackets: [
      { upTo: 43_198, rate: 0.087 },
      { upTo: 86_395, rate: 0.145 },
      { upTo: 154_244, rate: 0.158 },
      { upTo: 215_943, rate: 0.178 },
      { upTo: 275_870, rate: 0.198 },
      { upTo: 550_000, rate: 0.208 },
      { upTo: 1_100_000, rate: 0.213 },
      { upTo: Infinity, rate: 0.218 },
    ],
    basicPersonalAmount: 10_818,
  },
};

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Calculate tax owing for a single schedule (federal or provincial).
 * Returns gross tax before the basic personal amount credit.
 */
function applyBrackets(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let previousUpTo = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= previousUpTo) break;

    const taxableInBracket =
      Math.min(taxableIncome, bracket.upTo) - previousUpTo;
    tax += taxableInBracket * bracket.rate;
    previousUpTo = bracket.upTo;
  }

  return tax;
}

/**
 * Calculate combined federal + provincial income tax for a single individual.
 *
 * @param taxableIncome - Gross income MINUS RRSP contributions.
 *                        TFSA has no tax effect.
 * @param province      - Province of residence.
 * @returns Total income tax owing (federal + provincial). Never negative.
 */
export function calculateTax(
  taxableIncome: number,
  province: Province
): number {
  if (taxableIncome <= 0) return 0;

  const federal = FEDERAL;
  const provincial = PROVINCIAL[province];

  // Gross tax from brackets
  const federalTax = applyBrackets(taxableIncome, federal.brackets);
  const provincialTax = applyBrackets(taxableIncome, provincial.brackets);

  // Basic personal amount credit — applied at the lowest marginal rate
  const federalCredit = federal.basicPersonalAmount * federal.brackets[0].rate;
  const provincialCredit =
    provincial.basicPersonalAmount * provincial.brackets[0].rate;

  const totalTax =
    Math.max(0, federalTax - federalCredit) +
    Math.max(0, provincialTax - provincialCredit);

  return Math.round(totalTax * 100) / 100;
}

/**
 * Get the marginal tax rate for a given taxable income and province.
 * Useful for capital gains tax estimation.
 */
export function getMarginalRate(
  taxableIncome: number,
  province: Province
): number {
  if (taxableIncome <= 0) return 0;

  function findMarginalRate(
    income: number,
    brackets: TaxBracket[]
  ): number {
    let previousUpTo = 0;
    for (const bracket of brackets) {
      if (income <= bracket.upTo) return bracket.rate;
      previousUpTo = bracket.upTo;
    }
    return brackets[brackets.length - 1].rate;
  }

  return (
    findMarginalRate(taxableIncome, FEDERAL.brackets) +
    findMarginalRate(taxableIncome, PROVINCIAL[province].brackets)
  );
}
