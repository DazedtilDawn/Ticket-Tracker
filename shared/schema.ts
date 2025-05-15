import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, varchar, date, smallint, pgEnum, char } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for the schema
export const bonusTriggerEnum = pgEnum('bonus_trigger', ['chore_completion', 'good_behavior_reward', 'respin']);
export const txnSourceEnum = pgEnum('txn_source', ['chore', 'bonus_spin', 'manual_add', 'manual_deduct', 'undo', 'family_contrib']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("child"), // "parent" or "child"
});

export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  tickets: integer("tickets").notNull(),
  recurrence: text("recurrence").default("daily"), // "daily", "weekly", "monthly"
  tier: text("tier").default("common"), // "common", "rare", "epic"
  image_url: text("image_url"), // Field for storing chore image URL
  is_active: boolean("is_active").default(true),
  emoji: varchar("emoji", { length: 4 }), // For storing a single emoji character
  last_bonus_assigned: date("last_bonus_assigned"), // Tracks the last date this chore was assigned as a bonus
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  asin: text("asin").notNull().unique(),
  image_url: text("image_url"),
  price_cents: integer("price_cents").notNull(),
  price_locked_cents: integer("price_locked_cents"),
  last_checked: timestamp("last_checked").defaultNow(),
  camel_last_checked: timestamp("camel_last_checked"),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  product_id: integer("product_id").notNull().references(() => products.id),
  tickets_saved: integer("tickets_saved").notNull().default(0),
  is_active: boolean("is_active").default(true),
});

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull().references(() => users.id),
    chore_id: integer("chore_id").references(() => chores.id),
    goal_id: integer("goal_id").references(() => goals.id),
    delta_tickets: integer("delta_tickets").notNull(),
    date: timestamp("date").defaultNow(), // This could be renamed to created_at in a future migration
    type: text("type").notNull().default("earn"), // "earn", "spend"
    note: text("note"), // Description of the transaction
    source: txnSourceEnum("source").notNull().default('chore'), // Where the transaction originated
    ref_id: integer("ref_id"), // For undo: original transactions.id; For bonus_spin: daily_bonus.id
    reason: text("reason"), // For manual adjustments, undo
  },
  (table) => {
    return {
      uniqUserChoreDate: uniqueIndex("uniq_user_chore_date_idx").on(
        table.user_id,
        table.chore_id,
        table.date
      ),
    };
  }
);

// Daily bonus feature - adds a special bonus to one chore per day per child
export const dailyBonus = pgTable("daily_bonus", {
  id: serial("id").primaryKey(),
  bonus_date: date("bonus_date").notNull(), // Date the bonus was assigned
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assigned_chore_id: integer("assigned_chore_id").references(() => chores.id, { onDelete: "set null" }), // Allows bonus via good behavior without a specific chore
  is_override: boolean("is_override").notNull().default(false), // Indicates if this was manually assigned
  is_spun: boolean("is_spun").notNull().default(false), // Tracks if the bonus wheel has been spun
  trigger_type: bonusTriggerEnum("trigger_type").notNull(), // What triggered this bonus (chore completion or good behavior)
  spin_result_tickets: smallint("spin_result_tickets"), // Number of tickets won from spinning the wheel
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqDateUser: uniqueIndex("uniq_date_user_idx").on(
      table.bonus_date,
      table.user_id
    ),
  };
});

// Magic link login tokens for passwordless auth
export const loginTokens = pgTable("login_tokens", {
  tokenHash: char("token_hash", { length: 64 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  ipFingerprint: text("ip_fingerprint"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  last_checked: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  tickets_saved: true,
  is_active: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  date: true,
});

// Auth schema
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
});

// Amazon product search schema
export const amazonSearchSchema = z.object({
  amazonUrl: z.string().url()
});

// Manual product creation schema
export const manualProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price_cents: z.number().int().min(1, "Price must be greater than 0"),
  amazonUrl: z.string().url("Please enter a valid URL").optional(),
  image_url: z.string().url("Please enter a valid image URL").optional(),
});

// Chore completion schema
export const completeChoreSchema = z.object({
  chore_id: z.number().int().positive(),
  user_id: z.number().int().positive().optional() // Optional user_id for when parents complete chores for children
});

// Bad behavior schema for deducting tickets
export const badBehaviorSchema = z.object({
  user_id: z.number().int().positive(),
  reason: z.string().min(1, "Reason is required"),
  tickets: z.number().int().positive("Must deduct at least 1 ticket")
});

// Good behavior schema for adding bonus tickets
export const goodBehaviorSchema = z.object({
  user_id: z.number().int().positive(),
  reason: z.string().min(1, "Reason is required"),
  tickets: z.number().int().positive("Must add at least 1 ticket")
});

// Transaction deletion schema
export const deleteTransactionSchema = z.object({
  transaction_id: z.number().int().positive()
});

// Daily bonus schema
export const insertDailyBonusSchema = createInsertSchema(dailyBonus).omit({
  id: true,
  created_at: true
});

// Spin wheel schema for parents
export const spinWheelSchema = z.object({
  user_id: z.number().int().positive(),
  assigned_chore_id: z.number().int().positive()
});

// Bonus spin schema for the wheel spin endpoint
export const bonusSpinSchema = z.object({
  daily_bonus_id: z.number().int().positive()
});

// Magic link login schema
export const magicLinkRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

export const magicLinkConsumeSchema = z.object({
  token: z.string().min(16, "Invalid token")
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type DailyBonus = typeof dailyBonus.$inferSelect;
export type InsertDailyBonus = z.infer<typeof insertDailyBonusSchema>;
export type Login = z.infer<typeof loginSchema>;
export type AmazonSearch = z.infer<typeof amazonSearchSchema>;
export type ManualProduct = z.infer<typeof manualProductSchema>;
export type CompleteChore = z.infer<typeof completeChoreSchema>;
export type BadBehavior = z.infer<typeof badBehaviorSchema>;
export type GoodBehavior = z.infer<typeof goodBehaviorSchema>;
export type DeleteTransaction = z.infer<typeof deleteTransactionSchema>;
export type SpinWheel = z.infer<typeof spinWheelSchema>;
export type BonusSpin = z.infer<typeof bonusSpinSchema>;
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type MagicLinkConsume = z.infer<typeof magicLinkConsumeSchema>;
export type LoginToken = typeof loginTokens.$inferSelect;
export type InsertLoginToken = typeof loginTokens.$inferInsert;
