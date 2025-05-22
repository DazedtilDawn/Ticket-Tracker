import * as React from "react";
import { CheckCircle2 } from "lucide-react";

interface SwipeableProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipeEnd?: () => void;
  threshold?: number; // Customizable swipe threshold (default 100px)
  direction?: "right" | "left"; // Swipe direction
}

export const Swipeable = React.forwardRef<HTMLDivElement, SwipeableProps>(
  ({ onSwipeEnd, children, threshold = 100, direction = "right", ...props }, ref) => {
    const startX = React.useRef<number | null>(null);
    const [swipePercentage, setSwipePercentage] = React.useState(0);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const directionMultiplier = direction === "right" ? 1 : -1;

    const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
      startX.current = e.touches[0].clientX;
    };

    const handleMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (startX.current === null) return;
      
      const currentX = e.touches[0].clientX;
      const diff = (currentX - startX.current) * directionMultiplier;
      
      // Only apply transform if swiping in the correct direction
      if (diff > 0) {
        // Calculate percentage of swipe (0-100%)
        const percentage = Math.min(100, Math.max(0, (diff / threshold) * 100));
        setSwipePercentage(percentage);
        
        if (contentRef.current) {
          // Apply transform to the content
          contentRef.current.style.transform = `translateX(${diff * directionMultiplier}px)`;
        }
      }
    };

    const handleEnd = (e: React.TouchEvent<HTMLDivElement>) => {
      if (startX.current === null) return;
      
      const diff = (e.changedTouches[0].clientX - startX.current) * directionMultiplier;
      
      // Reset transform
      if (contentRef.current) {
        contentRef.current.style.transform = '';
      }
      
      // If swiped enough, trigger the callback
      if (diff > threshold) {
        onSwipeEnd?.();
      }
      
      // Reset state
      startX.current = null;
      setSwipePercentage(0);
    };

    // Reset on cancel
    const handleCancel = () => {
      if (contentRef.current) {
        contentRef.current.style.transform = '';
      }
      startX.current = null;
      setSwipePercentage(0);
    };

    return (
      <div 
        ref={ref} 
        className="relative overflow-hidden"
        onTouchStart={handleStart} 
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleCancel}
        {...props}
      >
        {/* Background indicator that appears during swipe */}
        <div 
          className={`absolute inset-0 flex items-center ${direction === "right" ? "justify-end pr-6" : "justify-start pl-6"} bg-green-500 text-white transition-opacity`}
          style={{ opacity: swipePercentage / 100 }}
        >
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        {/* Content container */}
        <div 
          ref={contentRef}
          className="relative bg-background transition-transform"
          style={{ transition: startX.current ? 'none' : 'transform 0.2s ease-out' }}
        >
          {children}
        </div>
      </div>
    );
  }
);
Swipeable.displayName = "Swipeable";
