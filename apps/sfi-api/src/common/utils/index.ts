/**
 * Common utility functions for the API
 */

/**
 * Generate a unique journal number
 */
export function generateJournalNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JRN-${timestamp}-${random}`;
}

/**
 * Generate a unique batch number
 */
export function generateBatchNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
}

/**
 * Paginate an array
 */
export function paginate<T>(items: T[], page: number, limit: number): { data: T[]; total: number } {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: items.slice(startIndex, endIndex),
    total: items.length,
  };
}
