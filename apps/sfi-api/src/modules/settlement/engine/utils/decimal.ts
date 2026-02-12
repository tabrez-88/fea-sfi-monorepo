/**
 * Decimal Utility for Safe Money Arithmetic
 *
 * Financial calculations must NEVER use floating point directly.
 * This module provides safe arithmetic by scaling to integer cents
 * and rounding properly at each step.
 *
 * All amounts are stored as numbers representing dollars (e.g., 150000000 = $150M).
 * Internal computation uses scaled integers to avoid precision loss.
 */

const SCALE = 100; // 2 decimal places for currency

/**
 * Round a number to 2 decimal places using banker's rounding.
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * SCALE) / SCALE;
}

/**
 * Multiply amount by percentage (0-100) and round.
 * e.g., mulPercent(150000000, 15) = 22500000
 */
export function mulPercent(amount: number, percentage: number): number {
  return roundMoney((amount * percentage) / 100);
}

/**
 * Subtract b from a, with rounding.
 */
export function subtract(a: number, b: number): number {
  return roundMoney(a - b);
}

/**
 * Add a and b, with rounding.
 */
export function add(a: number, b: number): number {
  return roundMoney(a + b);
}

/**
 * Sum an array of numbers.
 */
export function sum(values: number[]): number {
  return roundMoney(values.reduce((acc, v) => acc + v, 0));
}

/**
 * Return the minimum of two values.
 */
export function minAmount(a: number, b: number): number {
  return Math.min(a, b);
}

/**
 * Return the maximum of a value and zero (clamp to non-negative).
 */
export function clampPositive(value: number): number {
  return Math.max(0, roundMoney(value));
}
