import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, varchar, date, smallint, pgEnum, char, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

/* ----------------------------------------------------------------
 *  ENUMS
 * ----------------------------------------------------------------*/
export const txnSourceEnum = pgEnum('txn_source', [
  // earnings
  'chore_completion',
  'bonus_spin',
  'good_behavior',
  'bad_behavior',
  'parent_adjustment',
  // reversals
  'undo_manual',
  'undo_chore_completion',
  'undo_bonus_spin',
  // family goals (phase-2, kept for forward-compat)
  'family_goal_contribution',
  'family_goal_spend',
]);

export const bonusTriggerEnum = pgEnum('bonus_trigger', [
  'chore_completion',
  'good_behavior_reward',
]);

/* ----------------------------------------------------------------
 *  FAMILIES
 * ----------------------------------------------------------------*/
export const families = pgTable('families', {
  id        : serial('id').primaryKey(),
  name      : text('name').notNull(),
  primaryParentId: integer('primary_parent_id'),  // Reference added with relations()
  timezone  : varchar('timezone', { length: 64 }).notNull().default('UTC'),
  createdAt : timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ----------------------------------------------------------------
 *  USERS
 * ----------------------------------------------------------------*/
export const users = pgTable("users", {
  id           : serial("id").primaryKey(),
  name         : text("name").notNull(),
  username     : text("username").notNull().unique(),
  email        : text("email").notNull().unique(),
  passwordHash : text("password_hash"),  // NULL for parent
  role         : text("role").$type<'parent' | 'child'>().notNull(),
  familyId     : integer("family_id"),   // Reference added with relations()
  balanceCache : integer("balance_cache").notNull().default(0),
  createdAt    : timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Set up relations for circular references
export const usersRelations = relations(users, ({ one }) => ({
  family: one(families, {
    fields: [users.familyId],
    references: [families.id],
  }),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  primaryParent: one(users, {
    fields: [families.primaryParentId],
    references: [users.id],
  }),
  members: many(users),
}));

/* ----------------------------------------------------------------
 *  CHORES
 * ----------------------------------------------------------------*/
export const chores = pgTable("chores", {
  id                : serial("id").primaryKey(),
  name              : text("name").notNull(),
  description       : text("description"),
  baseTickets       : integer("base_tickets").notNull(),
  recurrence        : text("recurrence"),         // daily / weekly / etc.
  emoji             : varchar("emoji", { length: 4 }),
  isActive          : boolean("is_active").notNull().default(true),
  lastBonusAssigned : date("last_bonus_assigned"),
  createdByUserId   : integer("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt         : timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ----------------------------------------------------------------
 *  CHORE COMPLETIONS
 * ----------------------------------------------------------------*/
export const choreCompletions = pgTable('chore_completions', {
  id             : serial('id').primaryKey(),
  userId         : integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  choreId        : integer('chore_id').notNull().references(() => chores.id, { onDelete: 'cascade' }),
  completionDate : date('completion_date').notNull(),
  createdAt      : timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  onePerDay: uniqueIndex('chore_completions_user_chore_day').on(t.userId, t.choreId, t.completionDate),
}));

/* ----------------------------------------------------------------
 *  PRODUCTS
 * ----------------------------------------------------------------*/
export const products = pgTable("products", {
  id              : serial("id").primaryKey(),
  title           : text("title").notNull(),
  asin            : text("asin").notNull().unique(),
  image_url       : text("image_url"),
  price_cents     : integer("price_cents").notNull(),
  price_locked_cents: integer("price_locked_cents"),
  last_checked    : timestamp("last_checked").defaultNow(),
  camel_last_checked: timestamp("camel_last_checked"),
});

/* ----------------------------------------------------------------
 *  GOALS
 * ----------------------------------------------------------------*/
export const goals = pgTable("goals", {
  id            : serial("id").primaryKey(),
  user_id       : integer("user_id").notNull().references(() => users.id),
  product_id    : integer("product_id").notNull().references(() => products.id),
  tickets_saved : integer("tickets_saved").notNull().default(0),
  is_active     : boolean("is_active").default(true),
});

/* ----------------------------------------------------------------
 *  TRANSACTIONS
 * ----------------------------------------------------------------*/
export const transactions = pgTable("transactions", {
  id             : serial("id").primaryKey(),
  userId         : integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  choreId        : integer("chore_id").references(() => chores.id),
  goalId         : integer("goal_id").references(() => goals.id),
  delta          : integer("delta").notNull(),
  createdAt      : timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  type           : text("type"),
  note           : text("note"),
  source         : txnSourceEnum("source").notNull(),
  refId          : integer("ref_id"),
  reason         : text("reason"),
  metadata       : jsonb("metadata"),
  toSharedGoalId : integer("to_shared_goal_id"), // FK -> shared_goals.id  (phase-2)
});

/* ----------------------------------------------------------------
 *  DAILY BONUS
 * ----------------------------------------------------------------*/
export const dailyBonus = pgTable("daily_bonus", {
  id                : serial("id").primaryKey(),
  userId            : integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bonusDate         : date("bonus_date").notNull(),
  assignedChoreId   : integer("assigned_chore_id").references(() => chores.id, { onDelete: "set null" }),
  triggerType       : bonusTriggerEnum("trigger_type").notNull(),
  isOverride        : boolean("is_override").notNull().default(false),
  isSpun            : boolean("is_spun").notNull().default(false),
  spinResultTickets : smallint("spin_result_tickets"),
  pendingMultiplier : smallint("pending_multiplier"),
  respinUsed        : boolean("respin_used").notNull().default(false),
  createdAt         : timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  onePerChildPerDay: uniqueIndex("daily_bonus_user_date").on(t.userId, t.bonusDate),
}));

/* ----------------------------------------------------------------
 *  LOGIN TOKENS
 * ----------------------------------------------------------------*/
export const loginTokens = pgTable("login_tokens", {
  tokenHash     : char("token_hash", { length: 64 }).primaryKey(),   // SHA-256
  userId        : integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt     : timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt     : timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt    : timestamp("consumed_at", { withTimezone: true }),
  ipFingerprint : text("ip_fingerprint"),
}, (t) => ({
  userIdx: index("login_tokens_user_idx").on(t.userId),
}));

/* ----------------------------------------------------------------
 *  INSERT SCHEMAS
 * ----------------------------------------------------------------*/

// Family schemas
export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  balanceCache: true,
});

// Chore schemas
export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
  createdAt: true,
  lastBonusAssigned: true,
});

// Chore completion schemas
export const insertChoreCompletionSchema = createInsertSchema(choreCompletions).omit({
  id: true,
  createdAt: true,
});

// Product schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  last_checked: true,
  camel_last_checked: true,
});

// Goal schemas
export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  tickets_saved: true,
  is_active: true,
});

// Transaction schemas
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Daily bonus schemas
export const insertDailyBonusSchema = createInsertSchema(dailyBonus).omit({
  id: true,
  createdAt: true,
});

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
});

// Magic link login schema
export const magicLinkRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

export const magicLinkConsumeSchema = z.object({
  token: z.string().min(16, "Invalid token")
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

// Spin wheel schema for parents
export const spinWheelSchema = z.object({
  user_id: z.number().int().positive(),
  assigned_chore_id: z.number().int().positive()
});

// Bonus spin schema for the wheel spin endpoint
export const bonusSpinSchema = z.object({
  daily_bonus_id: z.number().int().positive()
});

/* ----------------------------------------------------------------
 *  TYPES
 * ----------------------------------------------------------------*/
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;

export type ChoreCompletion = typeof choreCompletions.$inferSelect;
export type InsertChoreCompletion = z.infer<typeof insertChoreCompletionSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type DailyBonus = typeof dailyBonus.$inferSelect;
export type InsertDailyBonus = z.infer<typeof insertDailyBonusSchema>;

export type LoginToken = typeof loginTokens.$inferSelect;
export type InsertLoginToken = typeof loginTokens.$inferInsert;

export type Login = z.infer<typeof loginSchema>;
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type MagicLinkConsume = z.infer<typeof magicLinkConsumeSchema>;
export type AmazonSearch = z.infer<typeof amazonSearchSchema>;
export type ManualProduct = z.infer<typeof manualProductSchema>;
export type CompleteChore = z.infer<typeof completeChoreSchema>;
export type BadBehavior = z.infer<typeof badBehaviorSchema>;
export type GoodBehavior = z.infer<typeof goodBehaviorSchema>;
export type DeleteTransaction = z.infer<typeof deleteTransactionSchema>;
export type SpinWheel = z.infer<typeof spinWheelSchema>;
export type BonusSpin = z.infer<typeof bonusSpinSchema>;
