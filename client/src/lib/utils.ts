import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format tier name with appropriate style class for Tailwind CSS
export function formatTierStyleClass(tier: string | undefined): string {
  if (!tier) return "bg-gray-500";
  
  switch (tier.toLowerCase()) {
    case "common":
      return "tier-common";
    case "rare":
      return "tier-rare";
    case "epic":
      return "tier-epic";
    default:
      return "bg-gray-500";
  }
}

// Format ticket count with appropriate suffix
export function formatTicketCount(count: number): string {
  return `${count} ticket${count !== 1 ? 's' : ''}`;
}

// Calculate readable time until completion
export function formatTimeUntilCompletion(days: number): string {
  if (days < 1) {
    return "Less than a day";
  } else if (days === 1) {
    return "1 day";
  } else if (days < 7) {
    return `${days} days`;
  } else {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    
    if (weeks === 1) {
      return remainingDays > 0 
        ? `1 week and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` 
        : "1 week";
    } else {
      return remainingDays > 0 
        ? `${weeks} weeks and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` 
        : `${weeks} weeks`;
    }
  }
}

// Format price from cents to dollars with formatting
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// Calculate percentage with lower bound (to avoid showing 0%)
export function calculatePercentWithMinimum(current: number, total: number, minimum = 0.5): number {
  if (current === 0) return 0;
  const percent = (current / total) * 100;
  return percent < minimum && percent > 0 ? minimum : percent;
}
