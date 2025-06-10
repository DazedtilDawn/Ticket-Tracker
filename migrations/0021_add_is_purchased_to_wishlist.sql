-- Add is_purchased column to wishlist_items table
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "is_purchased" boolean DEFAULT false;