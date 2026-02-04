/**
 * Shared utility functions for SFI-FEA platform
 */

/**
 * Generate a deterministic hash for proof records
 * @param data - The data to hash
 * @returns A hex string representation of the hash
 */
export function generateProofHash(data: Record<string, unknown>): string {
  // TODO: Implement proper cryptographic hashing (e.g., SHA-256)
  // This is a placeholder implementation
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Format a monetary amount with currency
 * @param amount - The amount in smallest currency unit (e.g., cents)
 * @param currency - The currency code
 * @returns Formatted string
 */
export function formatMoney(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount / 100);
}

/**
 * Deep clone an object
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a value is a non-null object
 * @param value - The value to check
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely parse JSON with a fallback
 * @param json - The JSON string to parse
 * @param fallback - The fallback value if parsing fails
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generate a unique batch number
 * @param prefix - The prefix for the batch number
 */
export function generateBatchNumber(prefix: string = 'BATCH'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Calculate percentage with precision
 * @param value - The value
 * @param total - The total
 * @param precision - Number of decimal places
 */
export function calculatePercentage(value: number, total: number, precision: number = 2): number {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(precision));
}
