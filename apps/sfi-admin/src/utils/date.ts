/**
 * Date formatters + comparators. Pure functions (no React, no side effects).
 * All inputs are ISO 8601 strings (the shape returned by the API).
 */

const DATE_SHORT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return DATE_SHORT.format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return DATE_TIME.format(new Date(iso));
}

export function isDateAfter(a: string, b: string): boolean {
  return new Date(a) > new Date(b);
}
