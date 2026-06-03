-- Migration: MS2 Round 4 (Liang) — Deal category + owner + extended status enum
--   1. Extend DealStatus enum with TERMINATED + ARCHIVED so the FE can
--      represent the full lifecycle Liang requested
--      (Draft / Active / Paused / Completed / Terminated / Archived).
--      SUSPENDED stays as the underlying enum and is relabeled "Paused"
--      in the FE only; CLOSED similarly relabels to "Completed".
--   2. Create DealCategory enum + nullable `category` column on Deal.
--      Optional so existing deals migrate in without one and admins can
--      back-fill via Edit Deal at their leisure.
--   3. Add `deal_owner` free-text column. Captures Creator / SPV /
--      Label / Studio / Production Company / person name — anything the
--      admin wants to type.
--
-- All changes are additive — no existing rows touched.

BEGIN;

-- 1. Extend DealStatus enum.
--    ADD VALUE must be outside a transaction in some Postgres versions;
--    wrap in DO blocks so re-runs are idempotent.
COMMIT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'TERMINATED'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DealStatus')
  ) THEN
    ALTER TYPE "DealStatus" ADD VALUE 'TERMINATED';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ARCHIVED'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DealStatus')
  ) THEN
    ALTER TYPE "DealStatus" ADD VALUE 'ARCHIVED';
  END IF;
END $$;

BEGIN;

-- 2. Create DealCategory enum (idempotent guard for repeated runs).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealCategory') THEN
    CREATE TYPE "DealCategory" AS ENUM (
      'MUSIC',
      'FILM_AND_TV',
      'LIVE_EVENTS_AND_SPORTS',
      'GAMES_AND_INTERACTIVE_MEDIA',
      'CREATOR_AND_CONSUMER_IP',
      'AI_AND_FUTURE_MEDIA'
    );
  END IF;
END $$;

-- 3. Add `category` + `deal_owner` columns on Deal. Both nullable so
--    existing rows survive without backfill.
ALTER TABLE "deals"
  ADD COLUMN IF NOT EXISTS "category" "DealCategory",
  ADD COLUMN IF NOT EXISTS "deal_owner" VARCHAR(255);

COMMIT;
