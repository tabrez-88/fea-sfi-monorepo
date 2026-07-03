-- MS-3 Wave 6 — two additions:
--
--   1. `deals.external_deal_id` (nullable, unique per user) — reconciliation
--      key for the Deal Registration CSV imports from FEA. Existing rows
--      keep NULL; the unique index treats each NULL as distinct so pre-Wave
--      rows don't collide with each other or with the new import path.
--
--   2. `perk_deliveries` table + `PerkDeliveryStatus` enum — first-class
--      perk / delivery tracking per participant. Powers the future MS5
--      role-gated view where investors see their own tracking info; here
--      the schema is landed so imports + admin CRUD can start.
--
-- Both changes are additive and non-destructive.

------------------------------------------------------------------
-- 1) Deal.externalDealId
------------------------------------------------------------------

ALTER TABLE "deals"
    ADD COLUMN "external_deal_id" VARCHAR(100);

CREATE UNIQUE INDEX "deals_userId_externalDealId_uidx"
    ON "deals"("user_id", "external_deal_id");

------------------------------------------------------------------
-- 2) PerkDelivery + PerkDeliveryStatus
------------------------------------------------------------------

CREATE TYPE "PerkDeliveryStatus" AS ENUM (
    'PENDING',
    'SHIPPED',
    'DELIVERED',
    'RETURNED',
    'CANCELLED'
);

CREATE TABLE "perk_deliveries" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "settlement_run_id" TEXT,
    "tracking_number" VARCHAR(255),
    "carrier" VARCHAR(100),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "status" "PerkDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perk_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "perk_deliveries_deal_id_idx" ON "perk_deliveries"("deal_id");
CREATE INDEX "perk_deliveries_participant_id_idx" ON "perk_deliveries"("participant_id");
CREATE INDEX "perk_deliveries_settlement_run_id_idx" ON "perk_deliveries"("settlement_run_id");
CREATE INDEX "perk_deliveries_status_idx" ON "perk_deliveries"("status");

ALTER TABLE "perk_deliveries"
    ADD CONSTRAINT "perk_deliveries_deal_id_fkey"
    FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perk_deliveries"
    ADD CONSTRAINT "perk_deliveries_participant_id_fkey"
    FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perk_deliveries"
    ADD CONSTRAINT "perk_deliveries_settlement_run_id_fkey"
    FOREIGN KEY ("settlement_run_id") REFERENCES "settlement_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
