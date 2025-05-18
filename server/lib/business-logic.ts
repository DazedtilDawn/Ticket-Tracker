import type { Chore } from "@shared/schema";

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
    .filter(chore => chore.is_active)
    .map(chore => chore.base_tickets)
    .sort((a, b) => a - b);
  
  // Calculate median value
  const mid = Math.floor(ticketValues.length / 2);
  const median = ticketValues.length % 2 === 0
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
 * Calculate progress percentage toward goal
 */
export function calculateProgressPercent(ticketsSaved: number, priceCents: number): number {
  if (!priceCents) return 0;
  
  // Convert tickets to cents (25 cents per ticket)
  const centsSaved = ticketsSaved * 25;
  
  // Calculate percentage
  const percent = (centsSaved / priceCents) * 100;
  
  // Return percentage with 1 decimal place
  return Math.min(100, Math.round(percent * 10) / 10);
}

/**
 * Calculate boost percentage that a chore gives toward goal
 */
export function calculateBoostPercent(choreTickets: number, goalPriceCents: number): number {
  if (!goalPriceCents) return 0;
  
  // Convert tickets to cents (25 cents per ticket)
  const centsBoosted = choreTickets * 25;
  
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
    .filter(tx => tx.type === 'earn')
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
  recentTicketsPerDay: number
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
