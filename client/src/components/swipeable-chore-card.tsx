import { useState, useMemo, useEffect, useRef } from "react";
import { Swipeable } from "./swipeable";
import confetti from "canvas-confetti";
import ChoreCard, { type ChoreCardProps } from "./chore-card";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompletedChore {
  choreId: number;
  timestamp: number;
  transactionId?: number;
}

// Global store for recently completed chores (for undo functionality)
// This persists even when component unmounts
const recentlyCompletedChores: CompletedChore[] = [];
const MAX_UNDO_TIME_MS = 10000; // 10 seconds undo window

export default function SwipeableChoreCard(props: ChoreCardProps) {
  const { toast } = useToast();
  const [isShowingUndo, setIsShowingUndo] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Don't enable swipe for mouse/trackpad devices
  const disableSwipe = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: fine)").matches;
  }, []);

  // Handle chore completion with undo notification
  const handleComplete = async () => {
    if (disableSwipe || props.chore.completed) return;
    
    try {
      // Visual and haptic feedback
      navigator.vibrate?.(24);
      confetti({ particleCount: 60, spread: 60 });
      
      // Actually complete the chore
      const result = await props.onComplete(props.chore.id);
      
      // Store the completed chore for potential undo
      const completedChore: CompletedChore = {
        choreId: props.chore.id,
        timestamp: Date.now(),
        transactionId: result?.transaction_id
      };
      
      // Remove any previous instances of this chore
      const existingIndex = recentlyCompletedChores.findIndex(c => c.choreId === props.chore.id);
      if (existingIndex >= 0) {
        recentlyCompletedChores.splice(existingIndex, 1);
      }
      
      // Add to recently completed chores
      recentlyCompletedChores.push(completedChore);
      
      // Show the undo UI
      setIsShowingUndo(true);
      
      // Set a timer to hide the undo UI after the undo window expires
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      
      undoTimerRef.current = setTimeout(() => {
        setIsShowingUndo(false);
      }, MAX_UNDO_TIME_MS);
      
      // Check for bonus trigger
      if (result && result.bonus_triggered && props.onBonusComplete && result.daily_bonus_id) {
        console.log("Bonus triggered from API response:", result.daily_bonus_id);
        props.onBonusComplete(result.daily_bonus_id, props.chore.name);
      }
    } catch (error) {
      console.error("Failed to complete chore:", error);
      toast({
        title: "Couldn't complete chore",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  
  // Handle the undo action
  const handleUndo = async () => {
    // Find the most recent completion of this chore
    const choreToUndo = recentlyCompletedChores.find(c => c.choreId === props.chore.id);
    
    if (!choreToUndo || !choreToUndo.transactionId) {
      setIsShowingUndo(false);
      return;
    }
    
    if (isUndoing) return;
    
    setIsUndoing(true);
    
    try {
      // Delete the transaction using the API
      await fetch(`/api/transactions/${choreToUndo.transactionId}`, {
        method: 'DELETE',
      });
      
      // Remove from recently completed chores
      const index = recentlyCompletedChores.findIndex(c => c.choreId === props.chore.id);
      if (index >= 0) {
        recentlyCompletedChores.splice(index, 1);
      }
      
      toast({
        title: "Chore completion undone",
        description: "The chore has been marked as incomplete again"
      });
      
      // Hide the undo UI
      setIsShowingUndo(false);
      
      // Refresh the data by invalidating the related queries
      // This will be handled in the dashboard component with the event bus
    } catch (error) {
      console.error("Failed to undo chore completion:", error);
      toast({
        title: "Couldn't undo",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsUndoing(false);
    }
  };
  
  // Dismiss the undo notification
  const dismissUndo = () => {
    setIsShowingUndo(false);
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Swipeable 
        onSwipeEnd={handleComplete}
        threshold={80}
        direction="right"
      >
        <ChoreCard {...props} />
      </Swipeable>
      
      {/* Undo toast notification (appears at the bottom of the card) */}
      {isShowingUndo && (
        <div className="absolute bottom-0 left-0 right-0 bg-green-100 dark:bg-green-900 p-3 border-t border-green-200 dark:border-green-700 rounded-b-lg shadow-lg animate-slideUp flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 hover:bg-green-200 dark:hover:bg-green-800"
            onClick={handleUndo}
            disabled={isUndoing}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {isUndoing ? "Undoing..." : "Undo"}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 p-1 h-7 w-7"
            onClick={dismissUndo}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
