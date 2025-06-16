-- Add is_archived and banner_color_preference columns to users table
ALTER TABLE users
  ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN banner_color_preference TEXT;

-- Add index for better performance when filtering archived users
CREATE INDEX idx_users_is_archived ON users(is_archived);

-- Update existing child users to have banner colors if they don't have one
-- This is a one-time migration to ensure existing children get colors
UPDATE users 
SET banner_color_preference = CASE 
  WHEN name = 'Bryce' THEN 'from-blue-400 to-purple-600'
  WHEN name = 'Kiki' THEN 'from-pink-400 to-purple-600'
  ELSE NULL
END
WHERE role = 'child' AND banner_color_preference IS NULL;