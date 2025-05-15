import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface SpinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpin: () => void;
  choreName: string;
  childName?: string;
  dailyBonusId?: number;
}

/**
 * A modal that prompts the user to spin the wheel for a bonus
 * This is triggered by both chore completion and good behavior rewards
 */
export function SpinPromptModal({
  isOpen,
  onClose,
  onSpin,
  choreName,
  childName,
}: SpinPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/40 dark:to-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            🎡 Bonus Wheel Spin! 🎡
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {childName ? `${childName} has` : "You've"} earned a chance to spin the
            wheel for completing: <strong>{choreName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <img 
            src="/wheel-icon.svg" 
            alt="Bonus Wheel" 
            className="w-24 h-24 mb-4 animate-pulse" 
          />
          <p className="text-center mb-4">
            Spin the wheel to see how many bonus tickets you'll win!
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Spin Later
          </Button>
          <Button
            type="button"
            onClick={onSpin}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
          >
            Spin Now!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}