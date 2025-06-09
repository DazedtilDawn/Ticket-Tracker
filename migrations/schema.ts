import { pgTable, unique, serial, text, uniqueIndex, foreignKey, date, integer, boolean, smallint, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const bonusTrigger = pgEnum("bonus_trigger", ['chore_completion', 'good_behavior_reward'])
export const txnSource = pgEnum("txn_source", ['chore', 'bonus_spin', 'manual_add', 'manual_deduct', 'undo', 'family_contrib'])


export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	role: text().default('child').notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const dailyBonus = pgTable("daily_bonus", {
	id: serial().primaryKey().notNull(),
	bonusDate: date("bonus_date").notNull(),
	userId: integer("user_id").notNull(),
	assignedChoreId: integer("assigned_chore_id"),
	isOverride: boolean("is_override").default(false).notNull(),
	isSpun: boolean("is_spun").default(false).notNull(),
	triggerType: bonusTrigger("trigger_type").notNull(),
	spinResultTickets: smallint("spin_result_tickets"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("uniq_date_user_idx").using("btree", table.bonusDate.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "daily_bonus_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedChoreId],
			foreignColumns: [chores.id],
			name: "daily_bonus_assigned_chore_id_chores_id_fk"
		}).onDelete("set null"),
]);

export const chores = pgTable("chores", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	tickets: integer().notNull(),
	recurrence: text().default('daily'),
	tier: text().default('common'),
	imageUrl: text("image_url"),
	isActive: boolean("is_active").default(true),
	emoji: varchar({ length: 4 }),
	lastBonusAssigned: date("last_bonus_assigned"),
});

export const goals = pgTable("goals", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	productId: integer("product_id").notNull(),
	ticketsSaved: integer("tickets_saved").default(0).notNull(),
	isActive: boolean("is_active").default(true),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "goals_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "goals_product_id_products_id_fk"
		}),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	asin: text().notNull(),
	imageUrl: text("image_url"),
	priceCents: integer("price_cents").notNull(),
	priceLockedCents: integer("price_locked_cents"),
	lastChecked: timestamp("last_checked", { mode: 'string' }).defaultNow(),
	camelLastChecked: timestamp("camel_last_checked", { mode: 'string' }),
}, (table) => [
	unique("products_asin_unique").on(table.asin),
]);

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	choreId: integer("chore_id"),
	goalId: integer("goal_id"),
	deltaTickets: integer("delta_tickets").notNull(),
	date: timestamp({ mode: 'string' }).defaultNow(),
	type: text().default('earn').notNull(),
	note: text(),
	source: txnSource().default('chore').notNull(),
	refId: integer("ref_id"),
	reason: text(),
}, (table) => [
	uniqueIndex("uniq_user_chore_date_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.choreId.asc().nullsLast().op("timestamp_ops"), table.date.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "transactions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.choreId],
			foreignColumns: [chores.id],
			name: "transactions_chore_id_chores_id_fk"
		}),
	foreignKey({
			columns: [table.goalId],
			foreignColumns: [goals.id],
			name: "transactions_goal_id_goals_id_fk"
		}),
]);
