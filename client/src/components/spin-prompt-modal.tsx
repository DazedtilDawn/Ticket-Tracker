import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface SpinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpin: (dailyBonusId: number) => void;
  choreName: string;
  childName: string;
  dailyBonusId: number;
}

export function SpinPromptModal({
  isOpen,
  onClose,
  onSpin,
  choreName,
  childName,
  dailyBonusId,
}: SpinPromptModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Run confetti effect when the modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);

      // Launch confetti
      const duration = 2000;
      const end = Date.now() + duration;

      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFC107", "#FF9800", "#FF5722"],
        });

        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFC107", "#FF9800", "#FF5722"],
        });
      }, 250);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  const handleSpin = () => {
    onSpin(dailyBonusId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">
            🌟 BONUS TIME, {childName}! 🌟
          </DialogTitle>
          <DialogDescription className="text-center">
            {choreName === "Good Behavior" ? (
              <span>
                You earned a special bonus spin for{" "}
                <strong>good behavior</strong>!
              </span>
            ) : (
              <span>
                You completed your special bonus chore:{" "}
                <strong>{choreName}</strong>!
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 animate-spin-slow"></div>
            <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <span className="text-5xl">🎡</span>
            </div>
          </div>
          <p className="mt-6 text-center font-medium">
            Spin the wheel for extra tickets!
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSpin}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400"
          >
            Spin Now!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
