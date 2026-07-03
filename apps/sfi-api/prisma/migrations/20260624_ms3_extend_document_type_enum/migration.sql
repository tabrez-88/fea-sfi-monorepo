-- MS-3 Wave 3 (Liang MS3-R3) — extend DocumentType enum with the Carta-style intake taxonomy.
--
-- Postgres enum extension is non-destructive: existing rows keep their values,
-- no table rewrites, no locks. Each ALTER TYPE ADD VALUE runs in its own
-- transaction implicitly (Postgres restriction), which is why the statements
-- are separate here rather than combined into a single command.

ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'OFFERING_DOCUMENT';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'INVESTOR_AGREEMENT';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'DISCLOSURE';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'REVENUE_SHARE_TERMS';
