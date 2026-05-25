import { Participant, Prisma } from '@prisma/client';

import { ParticipantBehaviorDto, ParticipantResponseDto } from '../dto';

/**
 * Keys that live inside `Participant.metadata` JSON but are surfaced as
 * top-level response fields. These mirror the optional typed fields on
 * `CreateParticipantDto` (FB-003 MS-2 — Round 2.1 f3/f4).
 *
 * Stored inside `metadata` to avoid a Prisma migration; the mapper extracts
 * them on read and strips them from the `metadata` response payload to
 * prevent duplication.
 */
export const INVESTMENT_METADATA_KEYS = [
  'investmentAmount',
  'units',
  'pricePerUnit',
  'poolMember',
] as const;

export interface InvestmentFields {
  investmentAmount?: number;
  units?: number;
  pricePerUnit?: number;
  poolMember?: boolean;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export class ParticipantMapper {
  static toResponse(participant: Participant): ParticipantResponseDto {
    const raw = (participant.metadata ?? null) as Record<string, unknown> | null;

    const investmentAmount = raw ? readNumber(raw.investmentAmount) : null;
    const units = raw ? readNumber(raw.units) : null;
    const pricePerUnit = raw ? readNumber(raw.pricePerUnit) : null;
    const poolMember = raw ? readBoolean(raw.poolMember) : null;

    let cleanMetadata: Record<string, unknown> | null = null;
    if (raw) {
      const copy = { ...raw };
      for (const key of INVESTMENT_METADATA_KEYS) {
        delete copy[key];
      }
      cleanMetadata = Object.keys(copy).length > 0 ? copy : null;
    }

    return {
      id: participant.id,
      dealId: participant.dealId,
      name: participant.name,
      roleName: participant.roleName,
      behaviorType: participant.behaviorType as ParticipantBehaviorDto,
      externalId: participant.externalId,
      email: participant.email,
      investmentAmount,
      units,
      pricePerUnit,
      poolMember,
      metadata: cleanMetadata,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    };
  }

  /**
   * Merge optional investment fields into a user-supplied metadata object
   * for persistence on `Participant.metadata`. Returns `Prisma.JsonNull`
   * when there is nothing to store.
   */
  static buildMetadata(
    userMetadata: Record<string, unknown> | undefined | null,
    investment: InvestmentFields,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    const base: Record<string, unknown> = userMetadata ? { ...userMetadata } : {};

    for (const key of INVESTMENT_METADATA_KEYS) {
      const value = investment[key];
      if (value !== undefined) {
        base[key] = value;
      }
    }

    return Object.keys(base).length === 0
      ? Prisma.JsonNull
      : (base as Prisma.InputJsonValue);
  }
}
