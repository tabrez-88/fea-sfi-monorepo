/**
 * Number / currency / string formatters. Pure functions, safe to call from
 * components, hooks, and services.
 */

/**
 * Money is rendered with cents ONLY when the amount actually has them, so
 * $200,000,000 stays readable while $125,743.29 stays exact. Liang 08/18
 * entered a revenue batch of $125,743.29 and the UI showed $125,743, which
 * is unacceptable on a platform whose engine tracks cent remainders.
 */
const MONEY_DIGITS = { minimumFractionDigits: 0, maximumFractionDigits: 2 };

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  ...MONEY_DIGITS,
});

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const NUMBER = new Intl.NumberFormat('en-US');

const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();
function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  const existing = CURRENCY_FORMATTERS.get(currency);
  if (existing) return existing;
  const created = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    ...MONEY_DIGITS,
  });
  CURRENCY_FORMATTERS.set(currency, created);
  return created;
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency?: string | null,
): string {
  if (value === null || value === undefined) return '-';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '-';
  if (!currency || currency === 'USD') return USD.format(n);
  return getCurrencyFormatter(currency).format(n);
}

export function formatCurrencyCompact(
  value: number | string | null | undefined,
  currency?: string | null,
): string {
  if (value === null || value === undefined) return '-';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '-';
  if (!currency || currency === 'USD') return USD_COMPACT.format(n);
  return getCompactFormatter(currency).format(n);
}

/** Applies the explicit +/- prefix shared by every signed formatter below. */
function withSign(value: number, base: string): string {
  if (value > 0) return `+${base}`;
  if (value < 0) return `-${base}`;
  return base;
}

const COMPACT_FORMATTERS = new Map<string, Intl.NumberFormat>();
function getCompactFormatter(currency: string): Intl.NumberFormat {
  const existing = COMPACT_FORMATTERS.get(currency);
  if (existing) return existing;
  const created = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  COMPACT_FORMATTERS.set(currency, created);
  return created;
}

/**
 * Explicitly signed money formatter for corrections and deltas (MS-4,
 * Liang 07/13): a correction can subtract as well as add, so every
 * correction amount carries a leading + or - instead of relying on
 * context. Zero renders unsigned.
 */
export function formatSignedCurrency(
  value: number | null | undefined,
  currency?: string | null,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return withSign(value, formatCurrency(Math.abs(value), currency));
}

/** Compact signed variant for tight cells (e.g. "+$600K"), currency-aware. */
export function formatSignedCurrencyCompact(
  value: number | null | undefined,
  currency?: string | null,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  const abs = Math.abs(value);
  const base =
    !currency || currency === 'USD'
      ? formatCurrencyCompact(abs)
      : getCompactFormatter(currency).format(abs);
  return withSign(value, base);
}

/**
 * Signed percentage with 1dp (e.g. "+2.5%", "-1.2%"). Values that round
 * to zero at the displayed precision render as an unsigned "0%" so a
 * +0.01% delta never shows up as a green "+0.0%".
 */
export function formatSignedPercent(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 1;
  const rounded = Number(abs.toFixed(digits));
  if (rounded === 0) return '0%';
  return withSign(value, `${rounded.toFixed(digits)}%`);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return NUMBER.format(value);
}

const UNITS = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });

/**
 * Pool units formatter. Units allow fractions up to 4 decimal places
 * (Liang 07/14 — 33.3333 units), and the default `formatNumber` caps at
 * 3 fraction digits which silently rendered 33.3333 as 33.333.
 */
export function formatUnits(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return UNITS.format(value);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}
