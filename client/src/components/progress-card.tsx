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
      price_locked_cents?: number; // Legacy field, deprecated
    };
    tickets_saved?: number; // Now calculated from balance
    progress: number;
    overSavedTickets?: number;
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
    complete: goal.progress >= 100,
  });

  const childUsers = getChildUsers();

  // Find the current child's profile data (assuming user_id in goal matches a child's id)
  const currentChild = childUsers.find((child) => child.id === goal.user_id);
  const childName = currentChild?.name || "";
  const profileImageUrl = currentChild?.profile_image_url;

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Generate Amazon product URL
  const amazonUrl = `https://www.amazon.com/dp/${goal.product.asin}`;

  // Calculate tickets needed - using 25 cents per ticket conversion
  const ticketsNeeded = Math.ceil(
    goal.product.price_cents / TICKET_CENT_VALUE,
  );

  // Calculate tickets remaining
  const ticketsRemaining = Math.max(0, ticketsNeeded - (goal.tickets_saved || 0));

  // Calculate money value of tickets
  const ticketValueInCents = TICKET_CENT_VALUE; // cents per ticket
  const ticketsMoneySaved = (
    ((goal.tickets_saved || 0) * ticketValueInCents) /
    100
  ).toFixed(2);
  const ticketsMoneyRemaining = (
    (ticketsRemaining * ticketValueInCents) /
    100
  ).toFixed(2);

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

  // Handle purchasing goal
  const handlePurchase = async () => {
    try {
      const response = await apiRequest(`/api/goals/${goal.id}/purchase`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show success toast
        toast({
          title: "🎉 Goal Purchased!",
          description: `Successfully purchased ${goal.product.title}! You have ${data.remainingBalance} tickets remaining.`,
          variant: "default",
        });

        // Launch celebration confetti
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#98FB98', '#87CEEB']
        });

        // Refresh the data to update UI
        onRefresh();
      } else {
        const errorData = await response.json();
        toast({
          title: "Purchase Failed",
          description: errorData.message || "Unable to complete purchase",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase goal",
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
        complete: goal.progress >= 100,
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
      if (
        !prevMilestones.complete &&
        newMilestones.complete &&
        !hasShownConfetti
      ) {
        toast({
          title: "🎉 Goal Complete!",
          description: `${childName} has all the tickets needed for their goal!`,
          variant: "default",
        });

        // Launch confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
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
            src={
              goal.product.image_url ||
              "https://placehold.co/300x300/e5e7eb/a1a1aa?text=No+Image"
            }
            alt={goal.product.title}
            className="h-full w-full object-contain shadow-md"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/300x300/e5e7eb/a1a1aa?text=Image+Error";
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
                Goal: {formatPrice(goal.product.price_cents)}
              </span>
            </div>
          </div>

          {/* Current progress summary */}
          <div className="relative z-10">
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              <span className="inline-block bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
                {Math.floor(goal.progress)}% Complete
              </span>{" "}
              •
              <span className="ml-1 text-gray-600 dark:text-gray-400">
                {goal.estimatedCompletion
                  ? `${
                      goal.estimatedCompletion.weeks > 0
                        ? `${goal.estimatedCompletion.weeks} ${goal.estimatedCompletion.weeks === 1 ? "week" : "weeks"}`
                        : `${goal.estimatedCompletion.days} ${goal.estimatedCompletion.days === 1 ? "day" : "days"}`
                    } left`
                  : "Calculating time..."}
              </span>
            </div>
          </div>
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-md shadow-md border border-gray-200 dark:border-gray-700 text-sm font-semibold flex items-center">
          <span className="text-green-600 dark:text-green-400">
            {formatPrice(goal.product.price_cents)}
          </span>
        </div>
      </div>

      {/* Progress visualization */}
      <div className="p-4 pt-5">
        {/* Interactive Journey Progress Bar */}
        <div className="relative h-10 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
          {/* Path/Road Background */}
          <div className="absolute inset-0 flex items-center px-1">
            <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full mx-1"></div>
          </div>

          {/* Milestone Markers */}
          <div className="absolute inset-0 flex justify-between px-2">
            {/* Start Marker */}
            <div
              className="w-6 h-6 -ml-1 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center text-xs font-bold"
              title="Starting Point"
            >
              <span className="text-gray-700 dark:text-gray-300">0%</span>
            </div>

            {/* 25% Milestone */}
            <div
              className={`w-6 h-6 transform -translate-x-1/2 rounded-full flex items-center justify-center transition-all duration-500 ${
                goal.progress >= 25
                  ? "bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400 dark:border-yellow-600"
                  : "bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
              }`}
              title="25% Complete"
            >
              <span
                className={`text-xs font-bold ${goal.progress >= 25 ? "text-yellow-700 dark:text-yellow-300" : "text-gray-500 dark:text-gray-400"}`}
              >
                25%
              </span>
            </div>

            {/* 50% Milestone */}
            <div
              className={`w-7 h-7 transform -translate-x-1/2 rounded-full flex items-center justify-center transition-all duration-500 ${
                goal.progress >= 50
                  ? "bg-orange-100 dark:bg-orange-900 border-2 border-orange-400 dark:border-orange-600"
                  : "bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
              }`}
              title="50% Complete"
            >
              <span
                className={`text-xs font-bold ${goal.progress >= 50 ? "text-orange-700 dark:text-orange-300" : "text-gray-500 dark:text-gray-400"}`}
              >
                50%
              </span>
            </div>

            {/* 75% Milestone */}
            <div
              className={`w-7 h-7 transform -translate-x-1/2 rounded-full flex items-center justify-center transition-all duration-500 ${
                goal.progress >= 75
                  ? "bg-pink-100 dark:bg-pink-900 border-2 border-pink-400 dark:border-pink-600"
                  : "bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
              }`}
              title="75% Complete"
            >
              <span
                className={`text-xs font-bold ${goal.progress >= 75 ? "text-pink-700 dark:text-pink-300" : "text-gray-500 dark:text-gray-400"}`}
              >
                75%
              </span>
            </div>

            {/* 100% Milestone - Goal */}
            <div
              className={`w-8 h-8 -mr-1 rounded-full shadow-md flex items-center justify-center transition-all duration-500 ${
                goal.progress >= 100
                  ? "bg-green-100 dark:bg-green-900 border-2 border-green-500 dark:border-green-500 animate-pulse"
                  : "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-500"
              }`}
              title="Goal Complete!"
            >
              <span
                className={`text-xs font-bold ${goal.progress >= 100 ? "text-green-700 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}`}
              >
                {goal.progress >= 100 ? "🎉" : "100%"}
              </span>
            </div>
          </div>

          {/* Progress Character/Indicator */}
          <div
            className="absolute top-0 left-0 h-full flex items-center pointer-events-none animate-bounce-slow"
            style={{ left: `${Math.min(98, Math.max(1, goal.progress))}%` }}
          >
            <div
              className="w-10 h-10 rounded-full bg-primary-500 dark:bg-primary-600 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center
                           transition-all duration-1000 z-10"
            >
              {/* Avatar for child's character */}
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={childName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold">
                  {getInitials(childName || "Goal")}
                </span>
              )}
            </div>
          </div>

          {/* Progress fill background */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 
                      dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 
                      transition-all duration-1000 ease-in-out"
            style={{ width: `${Math.min(100, goal.progress)}%` }}
          />

          {/* Progress percentage display */}
          <div className="absolute top-0 right-4 mt-1 px-2 py-0.5 rounded-md bg-white/80 dark:bg-gray-800/80 text-xs font-bold text-gray-700 dark:text-gray-300 shadow">
            {Math.floor(goal.progress)}% Complete
          </div>
        </div>

        {/* Achievement badges collection with tooltips */}
        {(goal.progress >= 25 ||
          goal.progress >= 50 ||
          goal.progress >= 75 ||
          goal.progress >= 100) && (
          <div className="relative p-3 mb-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 text-center">
              Achievement Badges
            </h4>

            <div className="flex flex-wrap gap-3 justify-center items-center">
              {/* 25% Milestone Badge */}
              <div
                className={`relative group cursor-pointer ${goal.progress >= 25 ? "animate-milestone-glow" : "opacity-40"}`}
              >
                <div
                  className={`p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full border-2 ${goal.progress >= 25 ? "border-yellow-400 dark:border-yellow-600" : "border-gray-300 dark:border-gray-600"}`}
                  title="25% Milestone"
                >
                  <span className="text-xl block">🌟</span>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-32 bg-black/80 text-white text-xs rounded py-1 px-2 hidden group-hover:block pointer-events-none">
                  <div className="text-center font-medium">
                    {goal.progress >= 25 ? "Star Collector!" : "Locked"}
                  </div>
                  <div className="text-center text-xs mt-0.5">
                    {goal.progress >= 25
                      ? "Reached 25% of goal"
                      : "Reach 25% to unlock"}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                </div>
              </div>

              {/* 50% Milestone Badge */}
              <div
                className={`relative group cursor-pointer ${goal.progress >= 50 ? "animate-milestone-glow" : "opacity-40"}`}
              >
                <div
                  className={`p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full border-2 ${goal.progress >= 50 ? "border-orange-400 dark:border-orange-600" : "border-gray-300 dark:border-gray-600"}`}
                  title="50% Milestone"
                >
                  <span className="text-xl block">🏆</span>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-32 bg-black/80 text-white text-xs rounded py-1 px-2 hidden group-hover:block pointer-events-none">
                  <div className="text-center font-medium">
                    {goal.progress >= 50 ? "Halfway Champion!" : "Locked"}
                  </div>
                  <div className="text-center text-xs mt-0.5">
                    {goal.progress >= 50
                      ? "Reached 50% of goal"
                      : "Reach 50% to unlock"}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                </div>
              </div>

              {/* 75% Milestone Badge */}
              <div
                className={`relative group cursor-pointer ${goal.progress >= 75 ? "animate-milestone-glow" : "opacity-40"}`}
              >
                <div
                  className={`p-2 bg-pink-100 dark:bg-pink-900/50 rounded-full border-2 ${goal.progress >= 75 ? "border-pink-400 dark:border-pink-600" : "border-gray-300 dark:border-gray-600"}`}
                  title="75% Milestone"
                >
                  <span className="text-xl block">🚀</span>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-32 bg-black/80 text-white text-xs rounded py-1 px-2 hidden group-hover:block pointer-events-none">
                  <div className="text-center font-medium">
                    {goal.progress >= 75 ? "Almost There!" : "Locked"}
                  </div>
                  <div className="text-center text-xs mt-0.5">
                    {goal.progress >= 75
                      ? "Reached 75% of goal"
                      : "Reach 75% to unlock"}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                </div>
              </div>

              {/* 100% Milestone Badge */}
              <div
                className={`relative group cursor-pointer ${goal.progress >= 100 ? "animate-milestone-glow" : "opacity-40"}`}
              >
                <div
                  className={`p-2 bg-green-100 dark:bg-green-900/50 rounded-full border-2 ${goal.progress >= 100 ? "border-green-400 dark:border-green-600 animate-pulse" : "border-gray-300 dark:border-gray-600"}`}
                  title="Goal Complete!"
                >
                  <span className="text-xl block">
                    {goal.progress >= 100 ? "🎉" : "🏁"}
                  </span>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-32 bg-black/80 text-white text-xs rounded py-1 px-2 hidden group-hover:block pointer-events-none">
                  <div className="text-center font-medium">
                    {goal.progress >= 100 ? "Goal Complete!" : "Finish Line"}
                  </div>
                  <div className="text-center text-xs mt-0.5">
                    {goal.progress >= 100
                      ? "You did it! Congrats!"
                      : "Reach 100% to unlock"}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tickets progress with visual indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow-sm">
            <div className="flex-shrink-0 mr-3 bg-amber-200 dark:bg-amber-800/30 h-10 w-10 rounded-full flex items-center justify-center">
              <Ticket className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400 font-medium">
                Saved
              </p>
              <div className="flex items-center">
                <span className="font-bold text-amber-800 dark:text-amber-300 text-lg">
                  {goal.tickets_saved || 0}
                </span>
                <span className="ml-1 text-amber-700 dark:text-amber-400 text-sm">
                  tickets
                </span>
                <span className="ml-2 text-xs text-amber-600/70 dark:text-amber-400/70">
                  (${ticketsMoneySaved})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <div className="flex-shrink-0 mr-3 bg-blue-200 dark:bg-blue-800/30 h-10 w-10 rounded-full flex items-center justify-center">
              <Ticket className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400 font-medium">
                Needed
              </p>
              <div className="flex items-center">
                <span className="font-bold text-blue-800 dark:text-blue-300 text-lg">
                  {ticketsRemaining}
                </span>
                <span className="ml-1 text-blue-700 dark:text-blue-400 text-sm">
                  more
                </span>
                <span className="ml-2 text-xs text-blue-600/70 dark:text-blue-400/70">
                  (${ticketsMoneyRemaining})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Over-saved badge */}
        {goal.overSavedTickets && goal.overSavedTickets > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Over-saved!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {goal.overSavedTickets} tickets will remain after purchase
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex flex-wrap gap-2 justify-end">
        {goal.progress >= 100 && (
          <Button
            onClick={handlePurchase}
            size="sm"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold shadow-lg"
          >
            🎉 Purchase Goal
          </Button>
        )}
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
