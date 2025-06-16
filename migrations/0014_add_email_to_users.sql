-- Add email column to users table with NOT NULL and UNIQUE constraints
-- First add as nullable, then update existing rows, then add constraints
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Set default emails for existing users based on username
UPDATE "users" SET "email" = CONCAT(username, '@example.com') WHERE "email" IS NULL;

-- Now add the constraints
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");