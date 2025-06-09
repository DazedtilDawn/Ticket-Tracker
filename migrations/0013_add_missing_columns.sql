-- Add missing columns that exist in schema but not in database
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "chores" RENAME COLUMN "tickets" TO "base_tickets";