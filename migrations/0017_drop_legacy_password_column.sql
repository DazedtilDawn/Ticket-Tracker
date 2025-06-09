-- Migration: 2025-06-09_drop_legacy_password_column
-- Purpose: Drop the legacy password column if it exists (replaced by password_hash)

-- Drop the password column if it exists
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";