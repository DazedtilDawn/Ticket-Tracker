-- Create families table
CREATE TABLE IF NOT EXISTS "families" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- Add missing columns if they don't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "family_id" integer;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "created_by_user_id" integer;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();

-- Add foreign key constraints with CASCADE
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_family_id_families_id_fk";
ALTER TABLE "users" ADD CONSTRAINT "users_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "chores" DROP CONSTRAINT IF EXISTS "chores_created_by_user_id_users_id_fk";
ALTER TABLE "chores" ADD CONSTRAINT "chores_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_user_id_users_id_fk";
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_product_id_products_id_fk";
ALTER TABLE "goals" ADD CONSTRAINT "goals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_users_id_fk";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_chore_id_chores_id_fk";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_goal_id_goals_id_fk";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_to_shared_goal_id_goals_id_fk";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_shared_goal_id_goals_id_fk" FOREIGN KEY ("to_shared_goal_id") REFERENCES "goals"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for foreign key columns
CREATE INDEX IF NOT EXISTS "goals_user_id_idx" ON "goals" ("user_id");
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "transactions_chore_id_idx" ON "transactions" ("chore_id");
CREATE INDEX IF NOT EXISTS "transactions_goal_id_idx" ON "transactions" ("goal_id");
CREATE INDEX IF NOT EXISTS "daily_bonus_user_id_idx" ON "daily_bonus" ("user_id");
CREATE INDEX IF NOT EXISTS "daily_bonus_assigned_chore_id_idx" ON "daily_bonus" ("assigned_chore_id");
CREATE INDEX IF NOT EXISTS "chore_completions_user_id_idx" ON "chore_completions" ("user_id");
CREATE INDEX IF NOT EXISTS "chore_completions_chore_id_idx" ON "chore_completions" ("chore_id");

-- Update timestamp columns to have timezone
ALTER TABLE "products" ALTER COLUMN "last_checked" TYPE timestamp with time zone;
ALTER TABLE "products" ALTER COLUMN "camel_last_checked" TYPE timestamp with time zone;
ALTER TABLE "transactions" ALTER COLUMN "created_at" TYPE timestamp with time zone;
ALTER TABLE "daily_bonus" ALTER COLUMN "created_at" TYPE timestamp with time zone;