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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
      {/* Product header with image and info */}
      <div className="relative flex h-48 sm:h-56 bg-gradient-to-r from-gray-50 to-white dark:from-gray-850 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Product image */}
        <div className="relative w-1/3 h-full overflow-hidden">
          <img
            data-testid="goal-image"
            src={goal.product.image_url || "https://placehold.co/300x300/e5e7eb/a1a1aa?text=No+Image"}
            alt={goal.product.title}
            className="h-full w-full object-contain shadow-md"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/300x300/e5e7eb/a1a1aa?text=Image+Error";
            }}
          />
        </div>
        
        {/* Product info */}
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2">
              {goal.product.title}
            </h3>
            
            <div className="mt-1 flex items-center">
              <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm font-semibold px-2.5 py-0.5 rounded-md flex items-center">
                <Trophy className="h-3.5 w-3.5 mr-1 text-primary-600 dark:text-primary-400" />
                Goal: {formatPrice(goal.product.price_locked_cents)}
              </span>
            </div>
          </div>
          
          {/* Current progress summary */}
          <div className="relative z-10">
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              <span className="inline-block bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
                {Math.floor(goal.progress)}% Complete
              </span> • 
              <span className="ml-1 text-gray-600 dark:text-gray-400">
                {goal.estimatedCompletion ? (
                  `${goal.estimatedCompletion.weeks > 0 
                    ? `${goal.estimatedCompletion.weeks} ${goal.estimatedCompletion.weeks === 1 ? 'week' : 'weeks'}` 
                    : `${goal.estimatedCompletion.days} ${goal.estimatedCompletion.days === 1 ? 'day' : 'days'}`} left`
                ) : (
                  'Calculating time...'
                )}
              </span>
            </div>
          </div>
        </div>
        
        {/* Price badge */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md shadow-md border border-gray-200 dark:border-gray-700 text-sm font-semibold flex items-center">
          <span className="text-green-600 dark:text-green-400">{formatPrice(goal.product.price_locked_cents)}</span>
        </div>
      </div>
      
      {/* Progress visualization */}
      <div className="p-4 pt-5">
        {/* Enhanced progress bar */}
        <div className="relative h-3 mb-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-400 dark:from-primary-600 dark:to-primary-500 transition-all duration-700 ease-in-out"
            style={{ width: `${Math.min(100, goal.progress)}%` }}
          >
            {/* Animated pulse at progress end to draw attention */}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md animate-pulse"></span>
          </div>
        </div>
        
        {/* Tickets progress with visual indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow-sm">
            <div className="flex-shrink-0 mr-3 bg-amber-200 dark:bg-amber-800/30 h-10 w-10 rounded-full flex items-center justify-center">
              <Ticket className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400 font-medium">Saved</p>
              <div className="flex items-center">
                <span className="font-bold text-amber-800 dark:text-amber-300 text-lg">{goal.tickets_saved}</span>
                <span className="ml-1 text-amber-700 dark:text-amber-400 text-sm">tickets</span>
                <span className="ml-2 text-xs text-amber-600/70 dark:text-amber-400/70">(${ticketsMoneySaved})</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <div className="flex-shrink-0 mr-3 bg-blue-200 dark:bg-blue-800/30 h-10 w-10 rounded-full flex items-center justify-center">
              <Ticket className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400 font-medium">Needed</p>
              <div className="flex items-center">
                <span className="font-bold text-blue-800 dark:text-blue-300 text-lg">{ticketsRemaining}</span>
                <span className="ml-1 text-blue-700 dark:text-blue-400 text-sm">more</span>
                <span className="ml-2 text-xs text-blue-600/70 dark:text-blue-400/70">(${ticketsMoneyRemaining})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="px-4 pb-4 flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchGoal}
          className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
        >
          Switch Goal
        </Button>
        <Button
          asChild
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400"
        >
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
            View on Amazon
          </a>
        </Button>
      </div>
    </div>
  );
}
