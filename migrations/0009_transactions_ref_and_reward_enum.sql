-- Create reward_type enum
CREATE TYPE "public"."reward_type" AS ENUM('tickets', 'spin');

-- Add unique index on user_id, chore_id, and date of created_at
-- This prevents duplicate chore completions on the same day
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_user_chore_day" 
  ON "transactions" ("user_id", "chore_id", date("created_at"))
  WHERE "chore_id" IS NOT NULL AND "source" = 'chore';