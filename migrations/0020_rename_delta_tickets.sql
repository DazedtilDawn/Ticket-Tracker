-- Rename delta_tickets to delta to match schema.ts
ALTER TABLE "transactions" 
RENAME COLUMN "delta_tickets" TO "delta";

-- Also rename 'date' to 'created_at' to match schema
ALTER TABLE "transactions" 
RENAME COLUMN "date" TO "created_at";