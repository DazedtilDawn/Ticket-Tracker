-- Rename tickets column to base_tickets if not already done
ALTER TABLE "chores" RENAME COLUMN "tickets" TO "base_tickets";

-- Create reward_type enum if not exists
DO $$ BEGIN
  CREATE TYPE "public"."reward_type" AS ENUM('tickets', 'spin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add unique index on user_id, chore_id, and date of created_at
-- This prevents duplicate chore completions on the same day
DROP INDEX IF EXISTS "uniq_user_chore_day";
CREATE UNIQUE INDEX "uniq_user_chore_day" 
  ON "transactions" ("user_id", "chore_id", date("created_at"))
  WHERE "chore_id" IS NOT NULL AND "source" = 'chore';

-- Update any column name references in the codebase should be handled at application level