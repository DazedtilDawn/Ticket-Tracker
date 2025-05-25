-- Drop the deprecated price_locked_cents column from products table
-- This column was used to lock prices at goal creation time, but we now use live prices
ALTER TABLE products DROP COLUMN IF EXISTS price_locked_cents;