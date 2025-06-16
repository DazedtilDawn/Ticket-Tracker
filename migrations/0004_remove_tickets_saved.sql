-- Remove the deprecated tickets_saved column from goals table
-- Goal progress is now calculated from user balance dynamically
ALTER TABLE goals DROP COLUMN IF EXISTS tickets_saved;