-- Migration: 2025-06-09_sync_schema_to_db
-- Purpose: Sync database schema with schema.ts definitions

-- 1. Create missing enums
DO $$ BEGIN
    CREATE TYPE reward_type AS ENUM ('tickets', 'spin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update bonus_trigger enum to add 'respin'
ALTER TYPE bonus_trigger ADD VALUE IF NOT EXISTS 'respin';

-- 2. Create missing tables

-- Create families table (foundation for multi-family support)
CREATE TABLE IF NOT EXISTS "families" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create awarded_items table (trophy system)
CREATE TABLE IF NOT EXISTS "awarded_items" (
    "id" SERIAL PRIMARY KEY,
    "child_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "awarded_by" INTEGER NOT NULL,
    "custom_note" TEXT,
    "awarded_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create chore_completions table
CREATE TABLE IF NOT EXISTS "chore_completions" (
    "id" SERIAL PRIMARY KEY,
    "chore_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "completion_datetime" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create daily_bonus_simple table
CREATE TABLE IF NOT EXISTS "daily_bonus_simple" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "bonus_tickets" INTEGER NOT NULL,
    "revealed" BOOLEAN NOT NULL DEFAULT FALSE,
    "assigned_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add missing columns to existing tables

-- Users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_image_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_color_preference" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_archived" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "balance_cache" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "family_id" INTEGER;

-- Chores table
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "recurrence" TEXT DEFAULT 'daily';
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "tier" TEXT DEFAULT 'common';
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT TRUE;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "emoji" VARCHAR(4);
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "last_bonus_assigned" DATE;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "created_by_user_id" INTEGER;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW();

-- Products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "asin" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price_cents" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "last_checked" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "camel_last_checked" TIMESTAMPTZ;

-- Add NOT NULL constraints where they don't exist yet
DO $$ 
BEGIN
    -- Products table constraints
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'title' AND is_nullable = 'YES') THEN
        UPDATE "products" SET "title" = 'Untitled Product' WHERE "title" IS NULL;
        ALTER TABLE "products" ALTER COLUMN "title" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'asin' AND is_nullable = 'YES') THEN
        UPDATE "products" SET "asin" = 'UNKNOWN_' || id::text WHERE "asin" IS NULL;
        ALTER TABLE "products" ALTER COLUMN "asin" SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_cents' AND is_nullable = 'YES') THEN
        UPDATE "products" SET "price_cents" = 0 WHERE "price_cents" IS NULL;
        ALTER TABLE "products" ALTER COLUMN "price_cents" SET NOT NULL;
    END IF;
END $$;

-- Add unique constraint on products.asin if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_asin_unique') THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_asin_unique" UNIQUE ("asin");
    END IF;
END $$;

-- Goals table
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "purchased_at" TIMESTAMPTZ;

-- Transactions table  
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "source" txn_source NOT NULL DEFAULT 'chore';
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "ref_id" INTEGER;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "metadata" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "to_shared_goal_id" INTEGER;

-- Daily bonus table
ALTER TABLE "daily_bonus" ADD COLUMN IF NOT EXISTS "spin_result_tickets" SMALLINT;

-- 4. Add foreign key constraints

-- Users table
ALTER TABLE "users" 
    ADD CONSTRAINT "users_family_id_fkey" 
    FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE;

-- Chores table
ALTER TABLE "chores"
    ADD CONSTRAINT "chores_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Goals table
ALTER TABLE "goals"
    ADD CONSTRAINT "goals_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "goals"
    ADD CONSTRAINT "goals_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;

-- Transactions table
ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_chore_id_fkey"
    FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE CASCADE;
ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_goal_id_fkey"
    FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE;
ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_ref_id_fkey"
    FOREIGN KEY ("ref_id") REFERENCES "transactions"("id") ON DELETE CASCADE;
ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_to_shared_goal_id_fkey"
    FOREIGN KEY ("to_shared_goal_id") REFERENCES "goals"("id") ON DELETE CASCADE;

-- Daily bonus table
ALTER TABLE "daily_bonus"
    ADD CONSTRAINT "daily_bonus_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "daily_bonus"
    ADD CONSTRAINT "daily_bonus_assigned_chore_id_fkey"
    FOREIGN KEY ("assigned_chore_id") REFERENCES "chores"("id") ON DELETE SET NULL;

-- Awarded items table
ALTER TABLE "awarded_items"
    ADD CONSTRAINT "awarded_items_child_id_fkey"
    FOREIGN KEY ("child_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "awarded_items"
    ADD CONSTRAINT "awarded_items_item_id_fkey"
    FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE CASCADE;
ALTER TABLE "awarded_items"
    ADD CONSTRAINT "awarded_items_awarded_by_fkey"
    FOREIGN KEY ("awarded_by") REFERENCES "users"("id") ON DELETE CASCADE;

-- Chore completions table
ALTER TABLE "chore_completions"
    ADD CONSTRAINT "chore_completions_chore_id_fkey"
    FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE CASCADE;
ALTER TABLE "chore_completions"
    ADD CONSTRAINT "chore_completions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Daily bonus simple table
ALTER TABLE "daily_bonus_simple"
    ADD CONSTRAINT "daily_bonus_simple_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- 5. Create missing indexes

-- Goals indexes
CREATE INDEX IF NOT EXISTS "goals_user_id_idx" ON "goals"("user_id");

-- Transactions indexes
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX IF NOT EXISTS "transactions_chore_id_idx" ON "transactions"("chore_id");
CREATE INDEX IF NOT EXISTS "transactions_goal_id_idx" ON "transactions"("goal_id");
CREATE INDEX IF NOT EXISTS "transactions_ref_id_idx" ON "transactions"("ref_id");

-- Daily bonus indexes
CREATE INDEX IF NOT EXISTS "daily_bonus_user_id_idx" ON "daily_bonus"("user_id");
CREATE INDEX IF NOT EXISTS "daily_bonus_assigned_chore_id_idx" ON "daily_bonus"("assigned_chore_id");

-- Chore completions indexes
CREATE UNIQUE INDEX IF NOT EXISTS "chore_user_date_idx" ON "chore_completions"("chore_id", "user_id", "completion_datetime");
CREATE INDEX IF NOT EXISTS "chore_completions_user_id_idx" ON "chore_completions"("user_id");
CREATE INDEX IF NOT EXISTS "chore_completions_chore_id_idx" ON "chore_completions"("chore_id");

-- 6. Update timestamp columns to use timezone
-- This is already handled by the column additions above with TIMESTAMPTZ type

-- 7. Handle column renames and type changes
-- Note: Some columns may need special handling if they already exist with different names
-- The schema expects 'base_tickets' but database might have 'tickets'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chores' AND column_name = 'tickets') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chores' AND column_name = 'base_tickets') THEN
        ALTER TABLE "chores" RENAME COLUMN "tickets" TO "base_tickets";
    END IF;
END $$;