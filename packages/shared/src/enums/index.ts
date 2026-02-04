/**
 * Enums shared across the SFI-FEA platform
 */

/**
 * Supported currencies for settlement amounts
 */
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CHF = 'CHF',
  CAD = 'CAD',
  AUD = 'AUD',
}

/**
 * Participant roles in a deal
 */
export enum ParticipantRole {
  PRODUCER = 'PRODUCER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  INVESTOR = 'INVESTOR',
  TALENT = 'TALENT',
  STUDIO = 'STUDIO',
  LICENSOR = 'LICENSOR',
  LICENSEE = 'LICENSEE',
  COLLECTION_AGENT = 'COLLECTION_AGENT',
}

/**
 * Settlement run types
 */
export enum RunType {
  NORMAL = 'NORMAL',
  CORRECTION = 'CORRECTION',
}

/**
 * Settlement phases for allocations
 */
export enum SettlementPhase {
  GROSS_RECEIPTS = 'GROSS_RECEIPTS',
  DISTRIBUTION_FEES = 'DISTRIBUTION_FEES',
  RECOUPMENT = 'RECOUPMENT',
  NET_PROFITS = 'NET_PROFITS',
}

/**
 * Deal status
 */
export enum DealStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

/**
 * Document types
 */
export enum DocumentType {
  CONTRACT = 'CONTRACT',
  AMENDMENT = 'AMENDMENT',
  REVENUE_REPORT = 'REVENUE_REPORT',
  SETTLEMENT_REPORT = 'SETTLEMENT_REPORT',
  AUDIT_REPORT = 'AUDIT_REPORT',
  PROOF_RECORD = 'PROOF_RECORD',
  OTHER = 'OTHER',
}

/**
 * Ledger account types
 */
export enum LedgerAccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

/**
 * Revenue batch status
 */
export enum RevenueBatchStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
}
