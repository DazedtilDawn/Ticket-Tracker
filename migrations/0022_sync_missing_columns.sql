-- Add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image_url" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_image_url" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banner_color_preference" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "achievement_ids" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_trophies" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showcase_trophies" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "family_id" integer;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refresh_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "balance_cache" integer;

-- Create families table if it doesn't exist
CREATE TABLE IF NOT EXISTS "families" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);

-- Add family foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_family_id_families_id_fk'
        AND table_name = 'users'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_family_id_families_id_fk" 
        FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Create family_parents table if it doesn't exist
CREATE TABLE IF NOT EXISTS "family_parents" (
    "family_id" integer NOT NULL REFERENCES "families"("id") ON DELETE CASCADE,
    "parent_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" text DEFAULT 'parent',
    "added_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("family_id", "parent_id")
);

-- Add missing columns to products table if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "family_id" integer REFERENCES "families"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing columns to chores table if they exist  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chores') THEN
        ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "base_tickets" integer;
        ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "family_id" integer REFERENCES "families"("id") ON DELETE CASCADE;
        -- Migrate tickets to base_tickets if needed
        UPDATE "chores" SET "base_tickets" = "tickets" WHERE "base_tickets" IS NULL AND "tickets" IS NOT NULL;
    END IF;
END $$;

-- Add missing columns to goals table if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
        ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "family_id" integer REFERENCES "families"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing columns to transactions table if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "performed_by_id" integer REFERENCES "users"("id");
        ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "family_id" integer REFERENCES "families"("id") ON DELETE CASCADE;
        -- Rename columns if they exist with old names
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'delta_tickets') THEN
                ALTER TABLE "transactions" RENAME COLUMN "delta_tickets" TO "delta";
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date') THEN
                ALTER TABLE "transactions" RENAME COLUMN "date" TO "created_at";
            END IF;
        END $$;
    END IF;
END $$;

-- Add missing columns to daily_bonus table if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_bonus') THEN
        ALTER TABLE "daily_bonus" ADD COLUMN IF NOT EXISTS "bonus_amount" integer DEFAULT 0;
        ALTER TABLE "daily_bonus" ADD COLUMN IF NOT EXISTS "is_pending" boolean DEFAULT false;
        ALTER TABLE "daily_bonus" ADD COLUMN IF NOT EXISTS "last_spin_date" date;
        ALTER TABLE "daily_bonus" ADD COLUMN IF NOT EXISTS "family_id" integer REFERENCES "families"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure wishlist_items has all columns
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "is_purchased" boolean DEFAULT false;
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "family_id" integer REFERENCES "families"("id") ON DELETE CASCADE;