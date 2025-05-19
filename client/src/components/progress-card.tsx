import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useState, useEffect, useRef } from "react";
import { Ticket, Star, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const progressContainerRef = useRef<HTMLDivElement>(null);
  
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
  const ticketsNeeded = Math.ceil(goal.product.price_locked_cents / 25);
  
  // Calculate tickets remaining
  const ticketsRemaining = Math.max(0, ticketsNeeded - goal.tickets_saved);
  
  // Calculate money value of tickets
  const ticketValueInCents = 25; // 25 cents per ticket
  const ticketsMoneySaved = (goal.tickets_saved * ticketValueInCents / 100).toFixed(2);
  const ticketsMoneyRemaining = (ticketsRemaining * ticketValueInCents / 100).toFixed(2);
  
  // Handle switching goals - navigate directly to wishlist for the current child
  const handleSwitchGoal = () => {
    try {
      // Navigate directly to the wishlist page with my-list tab active
      navigate("/wishlist?tab=my-list");
      
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
          variant: "success"
        });
        
        // Launch confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        setHasShownConfetti(true);
      }
      
      setPassedMilestones(newMilestones);
    };
    
    checkMilestones();
  }, [goal.progress, childName, passedMilestones, hasShownConfetti, toast]);
  
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <img 
          src={goal.product.image_url || "https://placehold.co/300x300/e5e7eb/a1a1aa?text=No+Image"} 
          alt={goal.product.title} 
          className="w-16 h-16 object-cover rounded-md"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/300x300/e5e7eb/a1a1aa?text=Image+Error";
          }}
        />
        
        <div className="ml-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{goal.product.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Price: {formatPrice(goal.product.price_locked_cents)}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800/50">
                <Ticket className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {ticketsNeeded} tickets needed
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced ticket value display */}
          <div className="flex items-center mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center">
              <Ticket className="w-3 h-3 mr-1 inline" />
              {goal.tickets_saved} tickets saved (${ticketsMoneySaved})
            </span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              <Ticket className="w-3 h-3 mr-1 inline" />
              {ticketsRemaining} to go (${ticketsMoneyRemaining})
            </span>
          </div>
          
          <div className="mt-3" ref={progressContainerRef}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                Progress: {goal.tickets_saved} of {ticketsNeeded} tickets saved
              </span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {Math.floor(goal.progress)}%
              </span>
            </div>

            {/* Enhanced progress bar with milestones */}
            <div className="relative">
              {/* Gradient progress bar */}
              <div className="relative h-5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, goal.progress)}%` }}
                />
                
                {/* Milestone markers */}
                {[25, 50, 75].map(milestone => (
                  <div 
                    key={`milestone-${milestone}`}
                    className={`absolute top-0 bottom-0 flex items-center justify-center ${goal.progress >= milestone ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}
                    style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
                  >
                    {milestone === 25 && (
                      <div className={`w-4 h-4 rounded-full ${goal.progress >= milestone ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'} flex items-center justify-center`}>
                        <Star className="w-2 h-2" />
                      </div>
                    )}
                    {milestone === 50 && (
                      <div className={`w-4 h-4 rounded-full ${goal.progress >= milestone ? 'bg-purple-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'} flex items-center justify-center`}>
                        <Star className="w-2 h-2" />
                      </div>
                    )}
                    {milestone === 75 && (
                      <div className={`w-4 h-4 rounded-full ${goal.progress >= milestone ? 'bg-pink-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'} flex items-center justify-center`}>
                        <Star className="w-2 h-2" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Avatar indicator moving along the progress bar */}
                <div 
                  className="absolute top-0 transform -translate-y-1/2"
                  style={{ 
                    left: `${Math.min(98, Math.max(2, goal.progress))}%`, 
                    transform: 'translateX(-50%)' 
                  }}
                >
                  <Avatar className="w-6 h-6 border-2 border-white dark:border-gray-900 shadow-md">
                    <AvatarImage src={profileImageUrl || undefined} alt={childName} />
                    <AvatarFallback className="text-[10px] bg-primary text-white">
                      {getInitials(childName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              {/* 100% trophy marker */}
              <div 
                className={`absolute right-0 top-0 bottom-0 transform translate-x-1/2 flex items-center justify-center ${goal.progress >= 100 ? 'text-yellow-500 animate-bounce-slow' : 'text-gray-400'}`}
              >
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
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
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSwitchGoal}>
            Switch Goal
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
              View on Amazon
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
