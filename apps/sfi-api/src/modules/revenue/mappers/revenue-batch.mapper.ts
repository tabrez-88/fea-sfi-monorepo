import { Prisma, RevenueBatch, RevenueLineItem } from '@prisma/client';

import {
  RevenueBatchResponseDto,
  CurrencyEnum,
  RevenueBatchStatusEnum,
  RevenueLineItemResponseDto,
} from '../dto';

type RevenueBatchWithSettlements = RevenueBatch & {
  _count?: { settlementRevenueLinks: number };
  lineItems?: RevenueLineItem[];
};

/**
 * Categorization keys (Run 5 / Round 4 Comment 24) — stored inside
 * `RevenueBatch.metadata` JSON and surfaced as top-level response fields.
 * Stripped from the `metadata` response payload by the mapper to avoid
 * duplicating them in two places of the same DTO.
 */
export const CATEGORIZATION_METADATA_KEYS = [
  'territory',
  'revenueType',
  'reportingEntity',
] as const;

export interface RevenueCategorizationFields {
  territory?: string;
  revenueType?: string;
  reportingEntity?: string;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export class RevenueBatchMapper {
  static toResponse(batch: RevenueBatchWithSettlements): RevenueBatchResponseDto {
    const settlementCount = batch._count?.settlementRevenueLinks ?? 0;
    const raw = (batch.metadata ?? null) as Record<string, unknown> | null;

    const territory = raw ? readString(raw.territory) : null;
    const revenueType = raw ? readString(raw.revenueType) : null;
    const reportingEntity = raw ? readString(raw.reportingEntity) : null;

    let cleanMetadata: Record<string, unknown> | null = null;
    if (raw) {
      const copy = { ...raw };
      for (const key of CATEGORIZATION_METADATA_KEYS) {
        delete copy[key];
      }
      cleanMetadata = Object.keys(copy).length > 0 ? copy : null;
    }

    return {
      id: batch.id,
      dealId: batch.dealId,
      batchNumber: batch.batchNumber,
      periodStart: batch.periodStart.toISOString(),
      periodEnd: batch.periodEnd.toISOString(),
      totalAmount: Number(batch.totalAmount),
      currency: batch.currency as CurrencyEnum,
      status: batch.status as RevenueBatchStatusEnum,
      source: batch.source,
      territory,
      revenueType,
      reportingEntity,
      metadata: cleanMetadata,
      isSettled: settlementCount > 0,
      settlementRunCount: settlementCount,
      lineItems: batch.lineItems?.map(RevenueBatchMapper.lineItemToResponse) ?? [],
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  static lineItemToResponse(row: RevenueLineItem): RevenueLineItemResponseDto {
    return {
      id: row.id,
      batchId: row.batchId,
      platformSource: row.platformSource,
      amount: Number(row.amount),
      currency: row.currency as CurrencyEnum,
      territory: row.territory,
      revenueType: row.revenueType,
      reportingEntity: row.reportingEntity,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Merge optional categorization fields into a caller-supplied metadata
   * object for persistence on `RevenueBatch.metadata`. Returns
   * `Prisma.JsonNull` when there is nothing to store.
   *
   * Categorization fields take priority — if the caller put a `territory`
   * key inside their `metadata` blob and ALSO set the top-level
   * `territory` field, the top-level value wins (server-side merge).
   *
   * Empty / whitespace-only strings on the categorization fields are
   * treated as "no value" (not persisted) — keeps the write side aligned
   * with the read side, which only surfaces non-empty strings.
   */
  static buildMetadata(
    userMetadata: Record<string, unknown> | undefined | null,
    categorization: RevenueCategorizationFields,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    const base: Record<string, unknown> = userMetadata ? { ...userMetadata } : {};

    for (const key of CATEGORIZATION_METADATA_KEYS) {
      const value = categorization[key];
      if (value === undefined) continue;
      const trimmed = value.trim();
      if (trimmed.length === 0) continue;
      base[key] = trimmed;
    }

    return Object.keys(base).length === 0
      ? Prisma.JsonNull
      : (base as Prisma.InputJsonValue);
  }
}
