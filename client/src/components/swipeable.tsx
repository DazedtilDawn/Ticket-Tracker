import * as React from "react";

interface SwipeableProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipeEnd?: () => void;
}

export const Swipeable = React.forwardRef<HTMLDivElement, SwipeableProps>(
  ({ onSwipeEnd, children, ...props }, ref) => {
    const startX = React.useRef<number | null>(null);

    const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
      startX.current = e.touches[0].clientX;
    };

    const handleEnd = (e: React.TouchEvent<HTMLDivElement>) => {
      if (startX.current === null) return;
      const diff = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(diff) > 40) {
        onSwipeEnd?.();
      }
      startX.current = null;
    };

    return (
      <div ref={ref} onTouchStart={handleStart} onTouchEnd={handleEnd} {...props}>
        {children}
      </div>
    );
  }
);
Swipeable.displayName = "Swipeable";
