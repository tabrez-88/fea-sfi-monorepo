-- Migration: FB-003 Run 3 — Rule Snapshot Integration
--   1. Extend SettlementPhase enum with the 3 v2 phases (POOL_REVENUE_SOURCE,
--      WATERFALL_TIER_1, WATERFALL_TIER_2). The 4 v1 values stay untouched
--      so existing proof records and SettlementAllocation rows remain valid.
--   2. Create participant_balances table for cross-snapshot cumulative
--      payout tracking (BE-FB003-HARDCAP). One row per
--      (deal, participant, ruleSnapshot) triple; enforces per-investor
--      hard caps across multiple settlement runs (clip-not-skip on cap).
--      `exit_conditions` is a JSON array of chip metadata for the FE
--      Detail page (Round 3 Comment 14 r8).
--
-- All changes are additive — no existing rows touched.

BEGIN;

-- 1. Extend SettlementPhase enum (v2 phases).
--    Postgres requires ALTER TYPE ADD VALUE outside a transaction in some
--    versions; we wrap in DO blocks that bail if the value already exists
--    so re-runs are idempotent.
ALTER TYPE "SettlementPhase" ADD VALUE IF NOT EXISTS 'POOL_REVENUE_SOURCE';
ALTER TYPE "SettlementPhase" ADD VALUE IF NOT EXISTS 'WATERFALL_TIER_1';
ALTER TYPE "SettlementPhase" ADD VALUE IF NOT EXISTS 'WATERFALL_TIER_2';

-- 2. Create participant_balances table.
CREATE TABLE "participant_balances" (
  "id"                     VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "deal_id"                VARCHAR NOT NULL,
  "participant_id"         VARCHAR NOT NULL,
  "rule_snapshot_id"       VARCHAR NOT NULL,
  "cumulative_payout"      DECIMAL(18, 2) NOT NULL DEFAULT 0,
  "last_settlement_run_id" VARCHAR,
  "exit_conditions"        JSONB,
  "updated_at"             TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE "participant_balances"
  ADD CONSTRAINT "participant_balances_deal_id_fkey"
    FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE;

ALTER TABLE "participant_balances"
  ADD CONSTRAINT "participant_balances_participant_id_fkey"
    FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE;

ALTER TABLE "participant_balances"
  ADD CONSTRAINT "participant_balances_rule_snapshot_id_fkey"
    FOREIGN KEY ("rule_snapshot_id") REFERENCES "rule_snapshots"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "participant_balances_deal_id_participant_id_rule_snapshot_id_key"
  ON "participant_balances" ("deal_id", "participant_id", "rule_snapshot_id");

CREATE INDEX "participant_balances_deal_id_idx" ON "participant_balances" ("deal_id");
CREATE INDEX "participant_balances_participant_id_idx" ON "participant_balances" ("participant_id");

COMMIT;
