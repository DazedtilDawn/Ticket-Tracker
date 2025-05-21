import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useState, useEffect, useRef } from "react";
import { Ticket, Star, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMobile } from "@/context/MobileContext";
import { TICKET_CENT_VALUE } from "../../../config/business";
import { TicketDisplay } from "@/components/ticket-display";

// Import confetti for celebrations
import confetti from "canvas-confetti";

interface ProgressCardProps {
  goal: {
    id: number;
    user_id: number;
    product: {
      id: number;
      title: string;
      asin: string;
      image_url: string;
      price_cents: number;
      price_locked_cents: number;
    };
    tickets_saved: number;
    progress: number;
    estimatedCompletion?: {
      days: number;
      weeks: number;
    };
  };
  onRefresh: () => void;
}

export default function ProgressCard({ goal, onRefresh }: ProgressCardProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, getChildUsers } = useAuthStore();
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const { isMobile } = useMobile();
  
  // Track when we've passed milestone percentages
  const [passedMilestones, setPassedMilestones] = useState({
    quarter: goal.progress >= 25,
    half: goal.progress >= 50,
    threeQuarters: goal.progress >= 75,
    complete: goal.progress >= 100
  });
  
  const childUsers = getChildUsers();
  
  // Find the current child's profile data (assuming user_id in goal matches a child's id)
  const currentChild = childUsers.find(child => child.id === goal.user_id);
  const childName = currentChild?.name || "";
  const profileImageUrl = currentChild?.profile_image_url;
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Generate Amazon product URL
  const amazonUrl = `https://www.amazon.com/dp/${goal.product.asin}`;
  
  // Calculate tickets needed - using 25 cents per ticket conversion
  const ticketsNeeded = Math.ceil(goal.product.price_locked_cents / TICKET_CENT_VALUE);
  
  // Calculate tickets remaining
  const ticketsRemaining = Math.max(0, ticketsNeeded - goal.tickets_saved);
  
  // Calculate money value of tickets
  const ticketValueInCents = TICKET_CENT_VALUE; // cents per ticket
  const ticketsMoneySaved = (goal.tickets_saved * ticketValueInCents / 100).toFixed(2);
  const ticketsMoneyRemaining = (ticketsRemaining * ticketValueInCents / 100).toFixed(2);
  
  // Handle switching goals - navigate directly to wishlist for the current child
  const handleSwitchGoal = () => {
    try {
      // Navigate directly to the wishlist page with my-list tab active
      navigate("/family-catalog?tab=my-list");
      
      toast({
        title: "Switch Goals",
        description: "Select a different goal from your wishlist.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to navigate to wishlist",
        variant: "destructive",
      });
    }
  };

  // Check for milestone achievements and show celebrations
  useEffect(() => {
    const checkMilestones = () => {
      // Define previous and current milestones
      const prevMilestones = { ...passedMilestones };
      const newMilestones = {
        quarter: goal.progress >= 25,
        half: goal.progress >= 50,
        threeQuarters: goal.progress >= 75,
        complete: goal.progress >= 100
      };
      
      // Only update state if milestones have actually changed
      const hasChanged = 
        prevMilestones.quarter !== newMilestones.quarter ||
        prevMilestones.half !== newMilestones.half ||
        prevMilestones.threeQuarters !== newMilestones.threeQuarters ||
        prevMilestones.complete !== newMilestones.complete;
        
      // Check if we've just passed a milestone
      if (!prevMilestones.quarter && newMilestones.quarter) {
        toast({
          title: "🌟 Milestone Reached!",
          description: `${childName} is 25% of the way to their goal!`,
        });
      }
      
      if (!prevMilestones.half && newMilestones.half) {
        toast({
          title: "🏆 Halfway There!",
          description: `${childName} has saved 50% of the tickets needed!`,
        });
      }
      
      if (!prevMilestones.threeQuarters && newMilestones.threeQuarters) {
        toast({
          title: "🚀 Almost There!",
          description: `${childName} is 75% of the way to their goal!`,
        });
      }
      
      // Show confetti for 100% completion
      if (!prevMilestones.complete && newMilestones.complete && !hasShownConfetti) {
        toast({
          title: "🎉 Goal Complete!",
          description: `${childName} has all the tickets needed for their goal!`,
          variant: "default"
        });
        
        // Launch confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        setHasShownConfetti(true);
      }
      
      // Only update state if something has changed to prevent infinite loop
      if (hasChanged) {
        setPassedMilestones(newMilestones);
      }
    };
    
    checkMilestones();
  }, [goal.progress, childName, hasShownConfetti, toast]);
  
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-start">
        {/* Larger product image with shadow */}
        <div className="relative aspect-square flex-shrink-0 overflow-hidden rounded-xl min-h-img mb-4 md:mb-0">
          <img
            data-testid="goal-image"
            src={goal.product.image_url || "https://placehold.co/300x300/e5e7eb/a1a1aa?text=No+Image"}
            alt={goal.product.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/300x300/e5e7eb/a1a1aa?text=Image+Error";
            }}
          />
          <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-700 text-xs font-semibold">
            {formatPrice(goal.product.price_locked_cents)}
          </div>
        </div>
        
        <div className="md:ml-6 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white text-lg">{goal.product.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Goal Price: {formatPrice(goal.product.price_locked_cents)}
              </p>
            </div>
            
            {/* info now shown in small text under progress bar */}
          </div>

          {/* Enhanced ticket value display with improved visuals */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3 mb-4">
            <div className="flex-1 p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400 font-medium mb-2">Tickets Saved</p>
              <div className="flex items-center">
                <TicketDisplay 
                  balance={goal.tickets_saved} 
                  size="md" 
                  className="mr-2"
                />
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ${ticketsMoneySaved} USD
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400 font-medium mb-2">Tickets Needed</p>
              <div className="flex items-center">
                <div className="flex items-center bg-white dark:bg-gray-800 shadow-md rounded-lg px-3 py-2 mr-2">
                  <Ticket className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-1.5" />
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {ticketsRemaining}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  ${ticketsMoneyRemaining} USD
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between mb-1 text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">{Math.min(100, Math.round(goal.progress))}% Complete</span>
              <span className="text-gray-500 dark:text-gray-400">{ticketsNeeded} total tickets needed</span>
            </div>
            <Progress 
              value={Math.min(100, goal.progress)} 
              className="h-2.5 bg-gray-200 dark:bg-gray-700" 
            />
          </div>

        </div>
        {/* Removed duplicate tickets to go text */}
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Est. completion:</span> {' '}
          {goal.estimatedCompletion ? (
            `${goal.estimatedCompletion.weeks > 0 
              ? `${goal.estimatedCompletion.weeks} ${goal.estimatedCompletion.weeks === 1 ? 'week' : 'weeks'}` 
              : `${goal.estimatedCompletion.days} ${goal.estimatedCompletion.days === 1 ? 'day' : 'days'}`} at current rate`
          ) : (
            'Not enough data to estimate'
          )}
        </div>
        <div className={isMobile ? "flex flex-col gap-2 w-full" : "flex space-x-2"}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchGoal}
            className={isMobile ? "w-full" : ""}
          >
            Switch Goal
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className={isMobile ? "w-full" : ""}
          >
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
              View on Amazon
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
