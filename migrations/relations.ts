import { relations } from "drizzle-orm/relations";
import { users, dailyBonus, chores, goals, products, transactions } from "./schema";

export const dailyBonusRelations = relations(dailyBonus, ({one}) => ({
	user: one(users, {
		fields: [dailyBonus.userId],
		references: [users.id]
	}),
	chore: one(chores, {
		fields: [dailyBonus.assignedChoreId],
		references: [chores.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	dailyBonuses: many(dailyBonus),
	goals: many(goals),
	transactions: many(transactions),
}));

export const choresRelations = relations(chores, ({many}) => ({
	dailyBonuses: many(dailyBonus),
	transactions: many(transactions),
}));

export const goalsRelations = relations(goals, ({one, many}) => ({
	user: one(users, {
		fields: [goals.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [goals.productId],
		references: [products.id]
	}),
	transactions: many(transactions),
}));

export const productsRelations = relations(products, ({many}) => ({
	goals: many(goals),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	chore: one(chores, {
		fields: [transactions.choreId],
		references: [chores.id]
	}),
	goal: one(goals, {
		fields: [transactions.goalId],
		references: [goals.id]
	}),
}));