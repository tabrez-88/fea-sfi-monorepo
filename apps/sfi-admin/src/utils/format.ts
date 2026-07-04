/**
 * Number / currency / string formatters. Pure functions, safe to call from
 * components, hooks, and services.
 */

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
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
    maximumFractionDigits: 0,
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
): string {
  if (value === null || value === undefined) return '-';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '-';
  return USD_COMPACT.format(n);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return NUMBER.format(value);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}
