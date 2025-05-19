import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TICKET_DOLLAR_VALUE } from "../../../config/business"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert tickets to USD value (25 cents per ticket)
 */
export function ticketsToUSD(tickets: number): string {
  const dollars = (tickets * TICKET_DOLLAR_VALUE).toFixed(2);
  return `$${dollars}`;
}

/**
 * Get the appropriate TailwindCSS class for a chore tier
 */
export function formatTierStyleClass(tier: string): string {
  switch (tier?.toLowerCase()) {
    case 'easy':
      return 'bg-green-500';
    case 'medium':
      return 'bg-orange-500';
    case 'hard':
      return 'bg-red-500';
    case 'special':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}