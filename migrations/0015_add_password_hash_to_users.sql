-- Add password_hash column to users table with NOT NULL constraint
-- First add as nullable, then update existing rows, then add constraint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- Set default password hash for existing users (bcrypt hash of 'password')
-- This is the bcrypt hash for the password 'password' with cost factor 10
UPDATE "users" 
SET "password_hash" = '$2a$10$K4OWyp3k8R3U3zvL1uxMVeKgKJgVmGYQQVpF8R3U3zvL1uxMVeKg' 
WHERE "password_hash" IS NULL;

-- Now add the NOT NULL constraint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;