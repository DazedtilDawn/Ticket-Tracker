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

          {/* Enhanced ticket value display with more visual elements */}
          <div className="flex items-center mt-2 mb-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center mr-4">
              <div className="relative mr-2">
                <Ticket className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  ✓
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {goal.tickets_saved} tickets saved
                </span>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ${ticketsMoneySaved} USD
                </p>
              </div>
            </div>
            
            <div className="h-8 border-r border-emerald-200 dark:border-emerald-700 mx-2"></div>
            
            <div className="flex items-center">
              <div className="relative mr-2">
                <Ticket className="w-6 h-6 text-emerald-600/70 dark:text-emerald-400/70" strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-800/70 dark:text-emerald-300/70">
                  →
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-emerald-800/80 dark:text-emerald-300/80">
                  {ticketsRemaining} tickets to go
                </span>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  ${ticketsMoneyRemaining} USD
                </p>
              </div>
            </div>
          </div>

        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {ticketsRemaining} tickets to go
        </p>
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
