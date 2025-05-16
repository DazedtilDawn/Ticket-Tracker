-- First, create the new enum types
CREATE TYPE "public"."bonus_trigger" AS ENUM('chore_completion', 'good_behavior_reward');
CREATE TYPE "public"."txn_source" AS ENUM('chore', 'bonus_spin', 'manual_add', 'manual_deduct', 'undo', 'family_contrib');

-- Add columns to chores table
ALTER TABLE "chores" ADD COLUMN "emoji" varchar(4);
ALTER TABLE "chores" ADD COLUMN "last_bonus_assigned" date;

-- Add columns to transactions table
ALTER TABLE "transactions" ADD COLUMN "source" "txn_source" DEFAULT 'chore' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "ref_id" integer;
ALTER TABLE "transactions" ADD COLUMN "reason" text;

-- Backup the old daily_bonus table
CREATE TABLE "daily_bonus_backup" AS SELECT * FROM "daily_bonus";

-- Drop the old table - this will cascade to any references
DROP TABLE "daily_bonus";

-- Create the new daily_bonus table
CREATE TABLE "daily_bonus" (
    "id" serial PRIMARY KEY NOT NULL,
    "bonus_date" date NOT NULL,
    "user_id" integer NOT NULL,
    "assigned_chore_id" integer,
    "is_override" boolean DEFAULT false NOT NULL,
    "is_spun" boolean DEFAULT false NOT NULL,
    "trigger_type" "bonus_trigger" NOT NULL,
    "spin_result_tickets" smallint,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "daily_bonus_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
    CONSTRAINT "daily_bonus_assigned_chore_id_chores_id_fk" FOREIGN KEY ("assigned_chore_id") REFERENCES "chores"("id") ON DELETE set null
);

-- Create the unique index for bonus_date and user_id
CREATE UNIQUE INDEX "uniq_date_user_idx" ON "daily_bonus" USING btree ("bonus_date","user_id");

-- Migrate data from the backup to the new table
INSERT INTO "daily_bonus" (
    "bonus_date", 
    "user_id", 
    "assigned_chore_id", 
    "is_override",
    "is_spun",
    "trigger_type",
    "spin_result_tickets"
)
SELECT 
    "bonus_date"::date, 
    "user_id", 
    "chore_id" AS "assigned_chore_id",
    false AS "is_override",
    "revealed" AS "is_spun",
    'chore_completion'::bonus_trigger AS "trigger_type",
    "bonus_tickets" AS "spin_result_tickets"
FROM "daily_bonus_backup";

-- Drop the backup table
DROP TABLE "daily_bonus_backup";