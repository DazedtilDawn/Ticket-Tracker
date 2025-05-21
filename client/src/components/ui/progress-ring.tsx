import type { ReactNode } from "react";

interface ProgressRingProps {
  percent: number;
  radius?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
}

export default function ProgressRing({ percent, radius = 38, stroke = 6, children, className = "" }: ProgressRingProps) {
  const r = radius - stroke / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg width={radius * 2} height={radius * 2} className={`progress-ring ${className}`}>
      <circle r={r} cx={radius} cy={radius} stroke="#E5E7EB" strokeWidth={stroke} fill="none" className="dark:stroke-gray-700" />
      <circle
        r={r}
        cx={radius}
        cy={radius}
        stroke="#22C55E"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-700 ease-out dark:stroke-emerald-500"
      />
      <foreignObject x="0" y="0" width={radius * 2} height={radius * 2}>
        <div className="flex items-center justify-center h-full">{children}</div>
      </foreignObject>
    </svg>
  );
}
