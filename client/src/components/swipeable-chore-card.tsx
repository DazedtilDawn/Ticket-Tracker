import { useRef } from "react";
import ChoreCard, { type ChoreCardProps } from "./chore-card";

export default function SwipeableChoreCard(props: ChoreCardProps) {
  const startX = useRef<number | null>(null);

  const onStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX;
  };

  const onEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const diff = e.changedTouches[0].clientX - startX.current;
    if (diff > 60) {
      props.onComplete(props.chore.id).catch(() => {});
      if (navigator.vibrate) navigator.vibrate(20);
    }
    startX.current = null;
  };

  return (
    <div onTouchStart={onStart} onTouchEnd={onEnd}>
      <ChoreCard {...props} />
    </div>
  );
}
