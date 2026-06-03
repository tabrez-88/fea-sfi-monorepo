-- ============================================================================
-- Manual migration: Sprint 1 cleanup follow-ups (2026-04-13)
-- ============================================================================
-- Apply BEFORE running `prisma migrate dev` so that Prisma sees the column
-- already at its target name/state and only diffs the remaining changes.
--
-- If you are running `prisma db push` instead, you can let Prisma drop and
-- recreate `deals.suspended_reason` (data loss). Use this script only when
-- you need to preserve existing rows.
--
-- Two changes:
--   1. Rename `deals.suspended_reason` -> `deals.notes`
--      (preserves data; column is nullable so no defaults needed)
--   2. Add `settlement_runs.run_number` (NOT NULL) with backfill +
--      unique constraint on (deal_id, run_number)
-- ============================================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- 1) Rename column: deals.suspended_reason -> deals.notes
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE "deals" RENAME COLUMN "suspended_reason" TO "notes";

-- ──────────────────────────────────────────────────────────────────────────
-- 2) Add settlement_runs.run_number with backfill
-- ──────────────────────────────────────────────────────────────────────────

-- 2a. Add nullable first so we can backfill safely.
ALTER TABLE "settlement_runs"
  ADD COLUMN "run_number" INTEGER;

-- 2b. Backfill: assign sequential numbers per deal, ordered by createdAt.
--     ROW_NUMBER() guarantees uniqueness within each (deal_id) partition.
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY deal_id ORDER BY created_at) AS rn
  FROM "settlement_runs"
)
UPDATE "settlement_runs" sr
SET "run_number" = numbered.rn
FROM numbered
WHERE sr.id = numbered.id;

-- 2c. Lock it down: NOT NULL + unique constraint.
ALTER TABLE "settlement_runs"
  ALTER COLUMN "run_number" SET NOT NULL;

ALTER TABLE "settlement_runs"
  ADD CONSTRAINT "settlement_runs_deal_id_run_number_key"
  UNIQUE ("deal_id", "run_number");

COMMIT;

-- ============================================================================
-- After applying:
--   - Run `pnpm --filter @sfi-fea/api db:generate` to regenerate the Prisma
--     client so TypeScript picks up the new column shapes.
--   - On Supabase / managed Postgres, paste this whole script into the SQL
--     editor and run it as a single transaction.
-- ============================================================================
