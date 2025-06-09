-- Add family_parents join table for multi-parent support
CREATE TABLE IF NOT EXISTS "family_parents" (
  "family_id" integer NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
  "parent_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'parent' NOT NULL,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("family_id", "parent_id")
);

-- Add indexes for family_parents
CREATE INDEX IF NOT EXISTS "family_parents_family_id_idx" ON "family_parents" ("family_id");
CREATE INDEX IF NOT EXISTS "family_parents_parent_id_idx" ON "family_parents" ("parent_id");

-- Add performed_by_id to transactions to track who performed the action
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "performed_by_id" integer REFERENCES "users"("id") ON DELETE SET NULL;

-- Add index for performed_by_id
CREATE INDEX IF NOT EXISTS "transactions_performed_by_id_idx" ON "transactions" ("performed_by_id");