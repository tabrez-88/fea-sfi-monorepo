-- Migration: FB-003 Run 4 — Documents V1 + Archive (BE-FB003-DOCUMENTS-V1)
-- Extends the documents table with:
--   * fileSize + mimeType — were synthesized by the stubbed service;
--     now real columns (Round 4 Comment 19/20 / Swagger audit).
--   * uploadedByUserId + archive fields — Round 4 Comments 20 + 21:
--     - uploadedByUserId tracks who uploaded a doc
--     - archivedAt + archivedByUserId + archivedReason enable soft-delete
--       (replaces hard-delete; preserves audit history per Liang Round 4 #21)
--
-- All new columns are nullable so existing rows survive the migration
-- with no backfill required. New FKs use ON DELETE SET NULL so deleting
-- a user doesn't cascade-delete their docs.

BEGIN;

-- 1. Add new columns to documents (all nullable, no backfill needed).
ALTER TABLE "documents"
  ADD COLUMN "file_size"             INTEGER,
  ADD COLUMN "mime_type"             VARCHAR(100),
  ADD COLUMN "uploaded_by_user_id"   VARCHAR,
  ADD COLUMN "archived_at"           TIMESTAMP,
  ADD COLUMN "archived_by_user_id"   VARCHAR,
  ADD COLUMN "archived_reason"       VARCHAR(500);

-- 2. Add FKs to users for uploadedBy + archivedBy. SetNull so user
--    deletion doesn't cascade-delete the document audit trail.
ALTER TABLE "documents"
  ADD CONSTRAINT "documents_uploaded_by_user_id_fkey"
    FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_archived_by_user_id_fkey"
    FOREIGN KEY ("archived_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- 3. Indexes:
--    * uploaded_by_user_id — supports "documents I uploaded" queries
--    * archived_at         — supports the default `archived_at IS NULL`
--                            list filter (active vs archived split)
CREATE INDEX "documents_uploaded_by_user_id_idx" ON "documents" ("uploaded_by_user_id");
CREATE INDEX "documents_archived_at_idx" ON "documents" ("archived_at");

COMMIT;
