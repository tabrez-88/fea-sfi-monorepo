-- MS-3 Wave 3 (Liang MS3-R1) — first-class line items with per-row categorization.
-- Territory / Revenue Type / Reporting Entity move FROM batch metadata JSON INTO
-- each line item. Batch-level `metadata.lineItems` stays for backward-compat.
--
-- Non-destructive: adds a new table + FK. Existing batches keep their JSON line
-- items until callers migrate to the new relation.

CREATE TABLE "revenue_line_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "platform_source" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "territory" VARCHAR(100),
    "revenue_type" VARCHAR(100),
    "reporting_entity" VARCHAR(255),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_line_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "revenue_line_items_batch_id_idx" ON "revenue_line_items"("batch_id");
CREATE INDEX "revenue_line_items_territory_idx" ON "revenue_line_items"("territory");
CREATE INDEX "revenue_line_items_revenue_type_idx" ON "revenue_line_items"("revenue_type");

ALTER TABLE "revenue_line_items"
    ADD CONSTRAINT "revenue_line_items_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "revenue_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
