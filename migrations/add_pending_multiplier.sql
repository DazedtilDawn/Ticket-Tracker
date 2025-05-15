-- Add pending_multiplier column to daily_bonus table
ALTER TABLE "daily_bonus" ADD COLUMN "pending_multiplier" smallint DEFAULT 1;