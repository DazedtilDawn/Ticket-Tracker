import { TICKET_DOLLAR_VALUE } from "../../../config/business";
import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketDisplayProps {
  balance: number;
  className?: string;
  showDollarValue?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function TicketDisplay({
  balance,
  className,
  showDollarValue = true,
  size = "md",
}: TicketDisplayProps) {
  const dollarValue = (balance * TICKET_DOLLAR_VALUE).toFixed(2);

  // Size mappings
  const sizeClasses = {
    sm: {
      container: "py-1 px-2 text-sm",
      icon: "w-3 h-3 mr-1",
      dollarText: "text-xs ml-1",
    },
    md: {
      container: "py-2 px-3 text-base",
      icon: "w-4 h-4 mr-1.5",
      dollarText: "text-sm ml-1.5",
    },
    lg: {
      container: "py-2.5 px-4 text-lg",
      icon: "w-5 h-5 mr-2",
      dollarText: "text-base ml-2",
    },
    xl: {
      container: "py-3 px-5 text-xl",
      icon: "w-6 h-6 mr-2.5",
      dollarText: "text-lg ml-2.5",
    },
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 shadow-md rounded-lg flex items-center font-medium border border-amber-200 dark:border-amber-800",
        sizeClasses[size].container,
        className,
      )}
    >
      <div className="flex items-center">
        <Ticket
          className={cn(
            "text-amber-500 dark:text-amber-400",
            sizeClasses[size].icon,
          )}
        />
        <span className="font-bold text-amber-700 dark:text-amber-300">
          {balance}
          <span className="text-amber-600 dark:text-amber-400 font-normal">
            tickets
          </span>
        </span>
      </div>

      {showDollarValue && (
        <div
          className={cn(
            "text-gray-500 dark:text-gray-400",
            sizeClasses[size].dollarText,
          )}
        >
          (${dollarValue})
        </div>
      )}
    </div>
  );
}
