import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert tickets to USD value (25 cents per ticket)
 */
export function ticketsToUSD(tickets: number): string {
  const dollars = (tickets * 0.25).toFixed(2);
  return `$${dollars}`;
}