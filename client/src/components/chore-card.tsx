import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTierStyleClass } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { CheckCircle, Award } from "lucide-react";
import { BonusBadge } from "@/components/bonus-badge";
import { useMobile } from "@/context/MobileContext";

interface ChoreCardProps {
  chore: {
    id: number;
    name: string;
    description: string;
    base_tickets: number;
    tier: string;
    is_active: boolean;
    image_url?: string;
    emoji?: string | null;
    completed?: boolean;
    boostPercent?: number;
    is_bonus?: boolean;
    bonus_tickets?: number;
    is_daily_bonus?: boolean;
    daily_bonus_id?: number;
  };
  onComplete: (id: number) => Promise<{
    bonus_triggered?: boolean;
    daily_bonus_id?: number;
    [key: string]: any;
  } | void>;
  onBonusComplete?: (dailyBonusId: number, choreName: string) => void;
}

export default function ChoreCard({ chore, onComplete, onBonusComplete }: ChoreCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isViewingAsChild, user } = useAuthStore();
  const viewingAsChild = isViewingAsChild();
  const { isMobile } = useMobile();
  
  // Handle chore completion with error handling
  const handleComplete = async () => {
    // Prevent multiple submissions or completing already completed chores
    if (chore.completed || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // This will trigger the onComplete callback in the parent component which calls /api/earn
      // The parent component will handle bonus checking and triggering the spin modal
      const result = await onComplete(chore.id);
      console.log("Chore completion result:", result);
      
      // Check if bonus was triggered from the API response (this is the critical fix)
      // The response from /api/earn will include bonus_triggered=true if this was the assigned bonus chore
      if (result && result.bonus_triggered && onBonusComplete && result.daily_bonus_id) {
        console.log("Bonus triggered from API response:", result.daily_bonus_id);
        onBonusComplete(result.daily_bonus_id, chore.name);
      }
    } catch (error) {
      // Error is handled by the parent component
      console.error("Failed to complete chore:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Determine if this is a bonus chore (legacy bonus system)
  const isBonusChore = chore.is_bonus && chore.bonus_tickets && chore.bonus_tickets > 0;
  
  // Check if this is a daily bonus chore (new daily bonus system)
  const isDailyBonusChore = chore.is_daily_bonus === true;
  
  return (
    <Card className={`overflow-hidden border ${isBonusChore ? 'border-yellow-400 dark:border-yellow-600' : 'border-gray-200 dark:border-gray-700'} hover:shadow-md transition-all duration-200 ${isBonusChore ? 'bg-gradient-to-b from-yellow-50 to-white dark:from-gray-900 dark:to-gray-800' : ''}`}>
      {/* Chore image (if available) */}
      {chore.image_url && (
        <div className="w-full aspect-video overflow-hidden relative bg-gray-100 dark:bg-gray-800">
          <img
            src={chore.image_url}
            alt={chore.name}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {isBonusChore && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center shadow-sm">
              <Award className="w-4 h-4 mr-1" />
              BONUS
            </div>
          )}
        </div>
      )}
      
      {/* Chore content */}
      <CardContent className="p-5">
        {/* Title and tier badge */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                {chore.emoji && <span className="mr-2 text-xl">{chore.emoji}</span>}
                {chore.name}
              </h4>
              {isDailyBonusChore && <BonusBadge className="ml-2" />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {chore.description || "No description"}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${formatTierStyleClass(chore.tier)}`}>
              {chore.tier}
            </span>
          </div>
        </div>
        
        {/* Tickets and action button */}
        <div className={`mt-4 ${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isBonusChore ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
              <i className={`ri-ticket-2-line ${isBonusChore ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary-600 dark:text-primary-400'} text-lg`}></i>
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {chore.base_tickets} tickets
                </p>
                {isBonusChore && (
                  <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-md font-semibold">
                    +{chore.bonus_tickets} bonus!
                  </span>
                )}
              </div>
              {chore.boostPercent !== undefined && (
                <p className="text-xs text-secondary-600 dark:text-secondary-400">
                  +{Math.max(0.5, chore.boostPercent).toFixed(1)}% to goal
                </p>
              )}
            </div>
          </div>
          
          {/* Action button */}
          {chore.completed ? (
            <Button
              disabled
              variant="outline"
              className={`text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 flex items-center ${isMobile ? 'w-full' : ''}`}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Completed
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className={`inline-flex items-center ${isBonusChore ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400' : ''} ${isMobile ? 'w-full py-3 text-base' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  Working...
                </>
              ) : viewingAsChild ? `Mark for ${user?.name}` : "Complete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
