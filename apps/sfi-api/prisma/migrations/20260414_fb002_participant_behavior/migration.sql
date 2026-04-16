-- Migration: FB-002 Role Taxonomy Refactor
-- Replaces the fixed ParticipantRole enum with open-ended roleName (display)
-- + ParticipantBehavior enum (settlement logic driver).
--
-- Old values are mapped as follows:
--   PRODUCER         → roleName='Producer',        behaviorType=NET_PROFIT_SHARE
--   DISTRIBUTOR      → roleName='Distributor',     behaviorType=FEE_DEDUCTION
--   INVESTOR         → roleName='Investor',        behaviorType=RECOUPMENT
--   TALENT           → roleName='Talent',          behaviorType=NET_PROFIT_SHARE
--   STUDIO           → roleName='Studio',          behaviorType=NET_PROFIT_SHARE
--   LICENSOR         → roleName='Licensor',        behaviorType=FLAT_FEE
--   LICENSEE         → roleName='Licensee',        behaviorType=PASS_THROUGH
--   COLLECTION_AGENT → roleName='Collection Agent',behaviorType=FEE_DEDUCTION

BEGIN;

-- 1. Create new behavior enum
CREATE TYPE "ParticipantBehavior" AS ENUM (
  'FEE_DEDUCTION',
  'RECOUPMENT',
  'NET_PROFIT_SHARE',
  'FLAT_FEE',
  'PASS_THROUGH'
);

-- 2. Add new columns (temporarily nullable to allow backfill)
ALTER TABLE participants
  ADD COLUMN role_name    VARCHAR(100),
  ADD COLUMN behavior_type "ParticipantBehavior";

-- 3. Backfill from existing role column
UPDATE participants SET
  role_name = CASE role::text
    WHEN 'PRODUCER'         THEN 'Producer'
    WHEN 'DISTRIBUTOR'      THEN 'Distributor'
    WHEN 'INVESTOR'         THEN 'Investor'
    WHEN 'TALENT'           THEN 'Talent'
    WHEN 'STUDIO'           THEN 'Studio'
    WHEN 'LICENSOR'         THEN 'Licensor'
    WHEN 'LICENSEE'         THEN 'Licensee'
    WHEN 'COLLECTION_AGENT' THEN 'Collection Agent'
    ELSE role::text
  END,
  behavior_type = CASE role::text
    WHEN 'PRODUCER'         THEN 'NET_PROFIT_SHARE'::"ParticipantBehavior"
    WHEN 'DISTRIBUTOR'      THEN 'FEE_DEDUCTION'::"ParticipantBehavior"
    WHEN 'INVESTOR'         THEN 'RECOUPMENT'::"ParticipantBehavior"
    WHEN 'TALENT'           THEN 'NET_PROFIT_SHARE'::"ParticipantBehavior"
    WHEN 'STUDIO'           THEN 'NET_PROFIT_SHARE'::"ParticipantBehavior"
    WHEN 'LICENSOR'         THEN 'FLAT_FEE'::"ParticipantBehavior"
    WHEN 'LICENSEE'         THEN 'PASS_THROUGH'::"ParticipantBehavior"
    WHEN 'COLLECTION_AGENT' THEN 'FEE_DEDUCTION'::"ParticipantBehavior"
    ELSE 'NET_PROFIT_SHARE'::"ParticipantBehavior"
  END;

-- 4. Enforce NOT NULL now that all rows are backfilled
ALTER TABLE participants
  ALTER COLUMN role_name    SET NOT NULL,
  ALTER COLUMN behavior_type SET NOT NULL;

-- 5. Drop old role column
ALTER TABLE participants DROP COLUMN role;

-- 6. Drop old enum
DROP TYPE "ParticipantRole";

COMMIT;
