-- Migration: Add child profile extras
-- Created: 2025-05-24

-- Add banner_color_preference and is_archived to users table
ALTER TABLE "users" ADD COLUMN "banner_color_preference" TEXT;
ALTER TABLE "users" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- Down migration (for rollback)
-- To rollback this migration, run:
-- ALTER TABLE "users" DROP COLUMN "banner_color_preference";
-- ALTER TABLE "users" DROP COLUMN "is_archived";