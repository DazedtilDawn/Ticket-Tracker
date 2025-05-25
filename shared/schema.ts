import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  varchar,
  date,
  smallint,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for the schema
export const bonusTriggerEnum = pgEnum("bonus_trigger", [
  "chore_completion",
  "good_behavior_reward",
  "respin",
]);
export const txnSourceEnum = pgEnum("txn_source", [
  "chore",
  "bonus_spin",
  "manual_add",
  "manual_deduct",
  "undo",
  "family_contrib",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("child"), // "parent" or "child"
  profile_image_url: text("profile_image_url"), // URL to the user's profile image
  banner_image_url: text("banner_image_url"), // URL to the user's banner image
  /** Parent-centric additions */
  banner_color_preference: text("banner_color_preference"), // e.g. "from-pink-500 to-indigo-300"
  is_archived: boolean("is_archived").notNull().default(false),
  balance_cache: integer("balance_cache"),
  created_at: timestamp("created_at", { withTimezone: true }),
  family_id: integer("family_id"),
});

export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  base_tickets: integer("base_tickets").notNull(),
  recurrence: text("recurrence").default("daily"), // "daily", "weekly", "monthly"
  tier: text("tier").default("common"), // "common", "rare", "epic"
  image_url: text("image_url"), // Field for storing chore image URL
  is_active: boolean("is_active").default(true),
  emoji: varchar("emoji", { length: 4 }), // For storing a single emoji character
  last_bonus_assigned: date("last_bonus_assigned"), // Tracks the last date this chore was assigned as a bonus
  created_by_user_id: integer("created_by_user_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  asin: text("asin").notNull().unique(),
  image_url: text("image_url"),
  price_cents: integer("price_cents").notNull(),
  last_checked: timestamp("last_checked").defaultNow(),
  camel_last_checked: timestamp("camel_last_checked"),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  product_id: integer("product_id")
    .notNull()
    .references(() => products.id),
  is_active: boolean("is_active").default(true),
  purchased_at: timestamp("purchased_at", { withTimezone: true }),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  chore_id: integer("chore_id").references(() => chores.id),
  goal_id: integer("goal_id").references(() => goals.id),
  delta: integer("delta").notNull(), // Ticket amount (positive or negative)
  created_at: timestamp("created_at").defaultNow(),
  type: text("type").notNull().default("earn"), // "earn", "spend"
  note: text("note"), // Description of the transaction
  source: txnSourceEnum("source").notNull().default("chore"), // Where the transaction originated
  ref_id: integer("ref_id"), // For undo: original transactions.id; For bonus_spin: daily_bonus.id
  reason: text("reason"), // For manual adjustments, undo
  metadata: text("metadata"), // JSON metadata
  to_shared_goal_id: integer("to_shared_goal_id"), // For shared goal contributions
});

// Daily bonus feature - adds a special bonus to one chore per day per child
export const dailyBonus = pgTable(
  "daily_bonus",
  {
    id: serial("id").primaryKey(),
    bonus_date: date("bonus_date").notNull(), // Date the bonus was assigned
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assigned_chore_id: integer("assigned_chore_id").references(
      () => chores.id,
      { onDelete: "set null" },
    ), // Allows bonus via good behavior without a specific chore
    is_override: boolean("is_override").notNull().default(false), // Indicates if this was manually assigned
    is_spun: boolean("is_spun").notNull().default(false), // Tracks if the bonus wheel has been spun
    trigger_type: bonusTriggerEnum("trigger_type").notNull(), // What triggered this bonus (chore completion or good behavior)
    spin_result_tickets: smallint("spin_result_tickets"), // Number of tickets won from spinning the wheel
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      uniqDateUser: uniqueIndex("uniq_date_user_idx").on(
        table.bonus_date,
        table.user_id,
      ),
    };
  },
);

// Trophy Award System - Step 1: Dedicated transaction model for trophy awards
export const awardedItems = pgTable("awarded_items", {
  id: serial("id").primaryKey(),
  child_id: integer("child_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  item_id: integer("item_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  awarded_by: integer("awarded_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  custom_note: text("custom_note"), // Optional custom note from parent
  awarded_at: timestamp("awarded_at", { withTimezone: true }).defaultNow(),
});

// Chore Completions - Dedicated table for tracking when chores are completed
export const choreCompletions = pgTable(
  "chore_completions",
  {
    id: serial("id").primaryKey(),
    chore_id: integer("chore_id")
      .notNull()
      .references(() => chores.id, { onDelete: "cascade" }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completion_datetime: timestamp("completion_datetime", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => {
    return {
      choreUserDateIdx: uniqueIndex("chore_user_date_idx").on(
        table.chore_id,
        table.user_id,
        table.completion_datetime,
      ),
    };
  },
);

// Daily Bonus Simple System (BONUS-01)
export const dailyBonusSimple = pgTable("daily_bonus_simple", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bonus_tickets: integer("bonus_tickets").notNull(),
  revealed: boolean("revealed").notNull().default(false),
  assigned_at: timestamp("assigned_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// 🔸 Schema used when a parent adds a child profile through POST /api/family/children
export const insertChildSchema = z.object({
  name: z.string().min(1, "Name is required"),
  profile_image_url: z.string().url("Must be a valid URL").optional(),
});

// 🔸 Schema used when a parent updates a child profile through PUT /api/family/children/:childId
export const updateChildSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  profile_image_url: z.string().nullable().optional(),
});

/**
 * Body for PATCH /api/family/children/:childId/archive
 * `{ archived: boolean }`
 */
export const archiveChildSchema = z.object({
  archived: z.boolean(),
});

export type ArchiveChildBody = z.infer<typeof archiveChildSchema>;

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  last_checked: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  is_active: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  created_at: true,
});

// Auth schema
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4), // Used for login, server verifies against passwordHash
});

// Amazon product search schema
export const amazonSearchSchema = z.object({
  amazonUrl: z.string().url(),
});

// Manual product creation schema
export const manualProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price_cents: z.coerce.number().min(1, "Price must be greater than 0"),
  amazonUrl: z.string().url("Please enter a valid URL").optional(),
  image_url: z.string().url("Please enter a valid image URL").optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  price_cents: z.coerce
    .number()
    .min(1, "Price must be greater than 0")
    .optional(),
  image_url: z.string().url("Please enter a valid image URL").optional(),
});

// Chore completion schema
export const completeChoreSchema = z.object({
  chore_id: z.number().int().positive(),
  user_id: z.number().int().positive().optional(), // Optional user_id for when parents complete chores for children
});

// Bad behavior schema for deducting tickets
export const badBehaviorSchema = z.object({
  user_id: z.number().int().positive(),
  reason: z.string().optional(), // Make reason optional
  tickets: z.number().int().positive("Must deduct at least 1 ticket"),
});

// Good behavior schema for adding bonus tickets or spin
export const goodBehaviorSchema = z
  .object({
    user_id: z.number().int().positive(),
    reason: z.string().optional(),
    rewardType: z.enum(["tickets", "spin"]),
    tickets: z.number().int().positive("Must add at least 1 ticket").optional(),
  })
  .refine(
    (data) => {
      // If rewardType is 'tickets', tickets must be present
      if (data.rewardType === "tickets") {
        return !!data.tickets;
      }
      return true;
    },
    {
      message: "Tickets amount is required when rewardType is 'tickets'",
      path: ["tickets"],
    },
  );

// Transaction deletion schema
export const deleteTransactionSchema = z.object({
  transaction_id: z.number().int().positive(),
});

// Daily bonus schema
export const insertDailyBonusSchema = createInsertSchema(dailyBonus).omit({
  id: true,
  created_at: true,
});

export const insertAwardedItemSchema = createInsertSchema(awardedItems).omit({
  id: true,
  awarded_at: true,
});

export const insertChoreCompletionSchema = createInsertSchema(choreCompletions).omit({
  id: true,
  completion_datetime: true,
});

// Trophy award schema for awarding items to children
export const awardItemSchema = z.object({
  item_id: z.number().int().positive("Item ID must be a positive number"),
  custom_note: z.string().optional(),
});

// Spin wheel schema for parents
export const spinWheelSchema = z.object({
  user_id: z.number().int().positive(),
  assigned_chore_id: z.number().int().positive(),
});

// Bonus spin schema for the wheel spin endpoint
export const bonusSpinSchema = z.object({
  daily_bonus_id: z.number().int().positive(),
  userId: z.number().int().positive().optional(), // For parent viewing as child
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
export type DailyBonusSimple = typeof dailyBonusSimple.$inferSelect;
export type InsertDailyBonusSimple = typeof dailyBonusSimple.$inferInsert;
export type AwardedItem = typeof awardedItems.$inferSelect;
export type InsertAwardedItem = z.infer<typeof insertAwardedItemSchema>;
export type ChoreCompletion = typeof choreCompletions.$inferSelect;
export type InsertChoreCompletion = z.infer<typeof insertChoreCompletionSchema>;
export type Login = z.infer<typeof loginSchema>;
export type AmazonSearch = z.infer<typeof amazonSearchSchema>;
export type ManualProduct = z.infer<typeof manualProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type CompleteChore = z.infer<typeof completeChoreSchema>;
export type BadBehavior = z.infer<typeof badBehaviorSchema>;
export type GoodBehavior = z.infer<typeof goodBehaviorSchema>;
export type DeleteTransaction = z.infer<typeof deleteTransactionSchema>;
export type SpinWheel = z.infer<typeof spinWheelSchema>;
export type BonusSpin = z.infer<typeof bonusSpinSchema>;
export type AwardItem = z.infer<typeof awardItemSchema>;
