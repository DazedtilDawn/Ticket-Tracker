-- Migration: 2025-06-10_email_nullable_with_partial_unique
-- Purpose: Make email nullable and add partial unique index

-- 1. Drop the existing unique constraint on email
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_unique";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";

-- 2. Make email column nullable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- 3. Create partial unique index (only enforces uniqueness when email is not null)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
ON users(email) WHERE email IS NOT NULL;