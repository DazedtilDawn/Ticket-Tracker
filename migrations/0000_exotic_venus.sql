CREATE TYPE "public"."bonus_trigger" AS ENUM('chore_completion', 'good_behavior_reward');--> statement-breakpoint
CREATE TYPE "public"."txn_source" AS ENUM('chore', 'bonus_spin', 'manual_add', 'manual_deduct', 'undo', 'family_contrib');--> statement-breakpoint
CREATE TABLE "chores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tickets" integer NOT NULL,
	"recurrence" text DEFAULT 'daily',
	"tier" text DEFAULT 'common',
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"emoji" varchar(4),
	"last_bonus_assigned" date
);
--> statement-breakpoint
CREATE TABLE "daily_bonus" (
	"id" serial PRIMARY KEY NOT NULL,
	"bonus_date" date NOT NULL,
	"user_id" integer NOT NULL,
	"assigned_chore_id" integer,
	"is_override" boolean DEFAULT false NOT NULL,
	"is_spun" boolean DEFAULT false NOT NULL,
	"trigger_type" "bonus_trigger" NOT NULL,
	"spin_result_tickets" smallint,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"tickets_saved" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"asin" text NOT NULL,
	"image_url" text,
	"price_cents" integer NOT NULL,
	"price_locked_cents" integer,
	"last_checked" timestamp DEFAULT now(),
	"camel_last_checked" timestamp,
	CONSTRAINT "products_asin_unique" UNIQUE("asin")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"chore_id" integer,
	"goal_id" integer,
	"delta_tickets" integer NOT NULL,
	"date" timestamp DEFAULT now(),
	"type" text DEFAULT 'earn' NOT NULL,
	"note" text,
	"source" "txn_source" DEFAULT 'chore' NOT NULL,
	"ref_id" integer,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'child' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "daily_bonus" ADD CONSTRAINT "daily_bonus_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_bonus" ADD CONSTRAINT "daily_bonus_assigned_chore_id_chores_id_fk" FOREIGN KEY ("assigned_chore_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_date_user_idx" ON "daily_bonus" USING btree ("bonus_date","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_chore_date_idx" ON "transactions" USING btree ("user_id","chore_id","date");