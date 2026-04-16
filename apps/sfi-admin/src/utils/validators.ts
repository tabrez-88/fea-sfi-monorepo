/**
 * Pure validation helpers. Reach for these inside Zod `refine()` blocks or
 * service-layer guards. Anything that needs React state belongs in a hook
 * instead.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/** Password rule used across register + reset-password forms. */
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /[0-9]/.test(value);
}
