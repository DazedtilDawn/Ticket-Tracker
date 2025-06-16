-- Add index on transactions.ref_id for better performance on undo operations
CREATE INDEX IF NOT EXISTS "transactions_ref_id_idx" ON "transactions" ("ref_id")
WHERE "ref_id" IS NOT NULL;