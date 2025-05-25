-- Migration: Add chore_completions table for tracking chore completion history
-- This replaces the inefficient transaction-based chore completion tracking

CREATE TABLE IF NOT EXISTS "chore_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"chore_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"completion_datetime" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add composite index for efficient queries
CREATE UNIQUE INDEX IF NOT EXISTS "chore_user_date_idx" ON "chore_completions" ("chore_id","user_id","completion_datetime");

-- Comment for documentation
COMMENT ON TABLE "chore_completions" IS 'Tracks when each chore was completed by each user for recurring chore reset functionality';