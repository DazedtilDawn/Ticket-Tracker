import { useMemo } from "react";
import { Swipeable } from "./swipeable";
import confetti from "canvas-confetti";
import ChoreCard, { type ChoreCardProps } from "./chore-card";

export default function SwipeableChoreCard(props: ChoreCardProps) {
  const disableSwipe = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: fine)").matches;
  }, []);

  const handleComplete = () => {
    if (disableSwipe) return;
    props.onComplete(props.chore.id).catch(() => {});
    navigator.vibrate?.(24);
    confetti({ particleCount: 60, spread: 60 });
  };

  return (
    <Swipeable onSwipeEnd={handleComplete}>
      <ChoreCard {...props} />
    </Swipeable>
  );
}
