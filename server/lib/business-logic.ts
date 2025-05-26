import type { Chore, Goal, Product, DailyBonusSimple } from "@shared/schema";
import { TICKET_CENT_VALUE } from "../../config/business";

/**
 * Calculate the tier of a chore based on tickets compared to other chores
 */
export function calculateTier(tickets: number, allChores: Chore[]): string {
  // Skip if there are less than 3 chores (not enough data for meaningful tiers)
  if (allChores.length < 3) {
    return tickets <= 5 ? "common" : tickets <= 10 ? "rare" : "epic";
  }

  // Get ticket values from active chores
  const ticketValues = allChores
    .filter((chore) => chore.is_active)
    .map((chore) => chore.base_tickets)
    .sort((a, b) => a - b);

  // Calculate median value
  const mid = Math.floor(ticketValues.length / 2);
  const median =
    ticketValues.length % 2 === 0
      ? (ticketValues[mid - 1] + ticketValues[mid]) / 2
      : ticketValues[mid];

  // Determine tier based on relative position to median
  if (tickets <= median * 0.75) {
    return "common";
  } else if (tickets <= median * 1.5) {
    return "rare";
  } else {
    return "epic";
  }
}

/**
 * Get current product price for a goal - always returns live price
 */
export function getCurrentProductPrice(goal: Goal & { product: Product }): number {
  return goal.product.price_cents;
}

/**
 * Calculate progress percentage toward goal
 */
export function calculateProgressPercent(
  ticketsSaved: number,
  priceCents: number,
): number {
  if (!priceCents) return 0;

  // Convert tickets to cents
  const centsSaved = ticketsSaved * TICKET_CENT_VALUE;

  // Calculate percentage
  const percent = (centsSaved / priceCents) * 100;

  // Return percentage with 1 decimal place
  return Math.min(100, Math.round(percent * 10) / 10);
}

/**
 * Calculate goal progress percentage based on user balance
 * This replaces the need to store tickets_saved on goals
 */
export function calculateGoalProgressFromBalance(
  userBalance: number,
  priceCents: number,
): number {
  return calculateProgressPercent(userBalance, priceCents);
}

/**
 * Calculate over-saved tickets (tickets beyond what's needed for the goal)
 */
export function calculateOverSavedTickets(
  ticketsSaved: number,
  priceCents: number,
): number {
  // Safeguard: ensure non-negative inputs
  const safeTicketsSaved = Math.max(0, ticketsSaved);
  const safePriceCents = Math.max(0, priceCents);
  
  if (!safePriceCents) return safeTicketsSaved;
  
  const ticketsNeeded = Math.ceil(safePriceCents / TICKET_CENT_VALUE);
  return Math.max(0, safeTicketsSaved - ticketsNeeded);
}

/**
 * Calculate boost percentage that a chore gives toward goal
 */
export function calculateBoostPercent(
  choreTickets: number,
  goalPriceCents: number,
): number {
  if (!goalPriceCents) return 0;

  // Convert tickets to cents
  const centsBoosted = choreTickets * TICKET_CENT_VALUE;

  // Calculate percentage
  const percent = (centsBoosted / goalPriceCents) * 100;

  // Return percentage with 1 decimal place, minimum 0.5%
  const roundedPercent = Math.round(percent * 10) / 10;
  return roundedPercent === 0 ? 0 : Math.max(0.5, roundedPercent);
}

/**
 * Determine if a user is on a streak
 */
export function isUserOnStreak(transactions: any[], requiredDays = 3): boolean {
  if (!transactions || transactions.length < requiredDays) {
    return false;
  }

  // Only consider earn transactions
  const earnTransactions = transactions
    .filter((tx) => tx.type === "earn")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (earnTransactions.length < requiredDays) {
    return false;
  }

  // Check if user completed at least one chore per day for the last requiredDays
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uniqueDays = new Set();

  for (const tx of earnTransactions) {
    const txDate = new Date(tx.date);
    txDate.setHours(0, 0, 0, 0);

    // Calculate days difference
    const diffTime = Math.abs(today.getTime() - txDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < requiredDays) {
      uniqueDays.add(diffDays);
    }
  }

  return uniqueDays.size >= requiredDays;
}

/**
 * Calculate streak bonus multiplier
 */
export function calculateStreakBonus(transactions: any[]): number {
  const isOnStreak = isUserOnStreak(transactions);

  // Give a 10% bonus for maintaining a streak
  return isOnStreak ? 1.1 : 1.0;
}

/**
 * Estimate completion time based on recent activity
 */
export function estimateCompletionTime(
  ticketsNeeded: number,
  recentTicketsPerDay: number,
): { days: number; weeks: number } | null {
  if (!recentTicketsPerDay || recentTicketsPerDay <= 0) {
    return null;
  }

  const daysToComplete = Math.ceil(ticketsNeeded / recentTicketsPerDay);

  return {
    days: daysToComplete,
    weeks: Math.ceil(daysToComplete / 7),
  };
}

/**
 * Calculate how many tickets are needed to purchase a product at the given price
 */
export function ticketsNeededFor(priceCents: number): number {
  return Math.ceil(priceCents / TICKET_CENT_VALUE);
}

/**
 * Assign a daily bonus to a user by picking a random ticket value and creating the bonus record
 */
export async function assignDailyBonus(userId: number): Promise<DailyBonusSimple> {
  const { storage } = await import("../storage");
  
  // Pick a random ticket value from [1,2,3,5,8]
  const ticketOptions = [1, 2, 3, 5, 8];
  const randomTickets = ticketOptions[Math.floor(Math.random() * ticketOptions.length)];
  
  // Create the daily bonus record
  const bonus = await storage.createDailyBonusSimple({
    user_id: userId,
    bonus_tickets: randomTickets,
    revealed: false,
  });
  
  return bonus;
}

/**
 * Generate random ticket reward for bonus spin
 * Returns random choice from [1,2,3,5,10] to match wheel display
 * FIXED: Changed from 8 to 10 to match wheel segment display
 */
export function spinTicketReward(): number {
  const ticketOptions = [1, 2, 3, 5, 10];
  return ticketOptions[Math.floor(Math.random() * ticketOptions.length)];
}
