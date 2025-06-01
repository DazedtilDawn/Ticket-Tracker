import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, RefreshCw, Star, Rocket } from "lucide-react";
import {
  pickAudio,
  SOURCES,
  createLoopingAudio,
  playOnce,
} from "@/utils/audio";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   DAILY BONUS WHEEL – v2
   • Truly centered, radial-math labels (78% toward rim)
   • SVG-driven wedges (pixel-perfect at any size)
   • Enhanced audio with Web Audio API
   • Improved error handling and recovery
   • Visual effects: glow, tick-sound, haptic, and confetti extras
   -----------------------------------------------------------------*/

interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
}

/* ------ wheel configuration -------------------------------------*/
const WHEEL_SEGMENTS = [
  { value: 1, color: "#FF6384", label: "1", text: "#fff" },
  { value: 2, color: "#36A2EB", label: "2", text: "#fff" },
  { value: 3, color: "#FFCE56", label: "3", text: "#000" },
  { value: 5, color: "#4BC0C0", label: "5", text: "#fff" },
  { value: 2, color: "#9966FF", label: "2", text: "#fff" },
  { value: 3, color: "#FF9F40", label: "3", text: "#000" },
  { value: 10, color: "#FFCD56", label: "10", text: "#000" },
  { value: 1, color: "#C9CBCF", label: "1", text: "#000" },
];

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

/* ----- svg helper ---------------------------------------------*/
function describeSlice(startAngle: number, endAngle: number, radius = 50) {
  // convert degrees to radians
  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;

  // calculate points on circumference
  const startX = radius + radius * Math.cos(start);
  const startY = radius + radius * Math.sin(start);
  const endX = radius + radius * Math.cos(end);
  const endY = radius + radius * Math.sin(end);

  // large arc flag
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  // SVG path
  return [
    `M ${radius} ${radius}`, // Move to center
    `L ${startX} ${startY}`, // Line to start point
    `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`, // Arc to end point
    "Z", // Close path
  ].join(" ");
}

export function DailyBonusWheel() {
  /* ----- hooks -------------------------------------------------*/
  const queryClient = useQueryClient();
  const { getChildUsers, isViewingAsChild } = useAuthStore();

  /* ----- UI state ----------------------------------------------*/
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedChore, setSelectedChore] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  /* ----- audio ------------------------------------------------*/
  // Store references to audio handlers for proper cleanup
  const wheelAudioRef = useRef<ReturnType<typeof createLoopingAudio> | null>(
    null,
  );
  const tickTimer = useRef<NodeJS.Timeout>();

  // Find compatible audio sources on mount
  const [cheerSrc, setCheerSrc] = useState<string | null>(null);

  // Initialize audio on component mount
  useEffect(() => {
    // Pick compatible audio sources for this browser
    const wheelSoundSrc = pickAudio(SOURCES.wheel);
    const cheerSoundSrc = pickAudio(SOURCES.cheer);

    setCheerSrc(cheerSoundSrc);

    // Initialize the wheel audio controller
    wheelAudioRef.current = createLoopingAudio(wheelSoundSrc, {
      volume: 0.2,
      fallbackTickInterval: 90,
      fallbackToneHz: 600,
    });

    // Clean up when component unmounts
    return () => {
      if (wheelAudioRef.current) {
        wheelAudioRef.current.cleanup();
      }

      if (tickTimer.current) {
        clearInterval(tickTimer.current);
      }
    };
  }, []);

  /* ----- data --------------------------------------------------*/
  const childUsers = getChildUsers();
  const { data: chores = [] } = useQuery({
    queryKey: ["/api/chores"],
    enabled: false, // Temporarily disabled to prevent API loopild(),
  });

  // Mutation to assign bonus tickets
  const spinMutation = useMutation({
    mutationFn: (d: { user_id: number; chore_id: number }) =>
      apiRequest("/api/spin-wheel", {
        method: "POST",
        body: JSON.stringify(d),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Bonus Assigned!",
        description: `Bonus tickets will be awarded when chore is completed`,
      });

      setIsSpinning(false);
    },
  });

  // Mutation to reset the daily bonus
  const resetBonusMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("/api/reset-daily-bonus", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }),
    onSuccess: () => {
      toast({
        title: "Bonus Reset",
        description: "Daily bonus has been cleared successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (err: any) => {
      toast({
        title: "Reset Failed",
        description: err.message || "Failed to reset the daily bonus",
        variant: "destructive",
      });
    },
  });

  /* ----- event handlers ----------------------------------------*/
  // Reset wheel and selection state
  const resetWheel = () => {
    if (selectedChild) {
      resetBonusMutation.mutate(Number(selectedChild));
    }
    setSelectedChore("");
    setRotation(0);
    setSpinResult(null);
    setIsSpinning(false);
  };

  // Main spin handler with revised animation and sound
  const handleSpin = () => {
    if (!selectedChild || !selectedChore) {
      toast({ title: "Select child & chore first", variant: "destructive" });
      return;
    }

    setIsSpinning(true);

    // Start wheel sound using our robust audio utility
    if (wheelAudioRef.current) {
      wheelAudioRef.current.start();
    }

    /* 1️⃣ wind-up */
    setRotation((r) => r - 35);

    /* 2️⃣ main spin */
    setTimeout(() => {
      const idx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);

      // Improved alignment math with exact pointer alignment and jitter to avoid divider lines
      const FULL_SPINS = 12;

      // ➊ exact centre-line of the chosen slice in SVG polar coords
      const midPoint =
        idx * SEGMENT_ANGLE - // east-based
        90 + // wheel rotated so 0° is north
        SEGMENT_ANGLE / 2; // move to slice centre

      // ➋ small random offset so we never land on a divider
      const JITTER_RANGE = SEGMENT_ANGLE / 2 - 4; // leave 4° safety margin
      const jitter = (Math.random() - 0.5) * 2 * JITTER_RANGE;

      // ➌ final rotation: lots of full spins, then land mid-slice plus offset
      const target = FULL_SPINS * 360 + 270 - midPoint + jitter;

      setRotation(target);

      /* send API mid-spin so DB is ready by landing */
      setTimeout(() => {
        spinMutation.mutate({
          user_id: +selectedChild,
          chore_id: +selectedChore,
        });
      }, 500);

      /* 3️⃣ on settle - stop the audio sooner */
      setTimeout(() => {
        // Stop spinning animation at end but keep wheel in final position
        setIsSpinning(false);
        setSpinResult(WHEEL_SEGMENTS[idx].value);
      }, 7000);

      /* Stop audio earlier - as soon as the wheel starts slowing down */
      setTimeout(() => {
        // Clean up any wheel audio
        if (wheelAudioRef.current) {
          wheelAudioRef.current.stop();
        }

        // Also clear any tick timer as a fallback
        if (tickTimer.current) {
          clearInterval(tickTimer.current);
          tickTimer.current = undefined;
        }
      }, 6000);

      /* Visual effects and celebration after wheel stops */
      setTimeout(() => {
        // glow slice
        const slices =
          wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
        slices?.forEach((s, i) =>
          i === idx
            ? s.classList.add("ring-4", "ring-yellow-300", "animate-pulse")
            : s.classList.remove("ring-4", "ring-yellow-300", "animate-pulse"),
        );

        // haptic
        navigator.vibrate?.([50, 60, 50]);

        // celebratory sound for the win using our robust audio utility
        playOnce(cheerSrc, {
          volume: 0.3,
          fallbackToneHz: 880, // higher pitch for win sound
        });

        // confetti for 10
        if (WHEEL_SEGMENTS[idx].value === 10) {
          import("canvas-confetti").then((m) =>
            m.default({ particleCount: 120, spread: 80, origin: { y: 0.6 } }),
          );
        }
      }, 7500);
    }, 300);
  };

  if (isViewingAsChild()) return null;

  /* ----- render ------------------------------------------------*/
  return (
    <Card className="w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-center mb-2">
          <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full">
            <Rocket className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
          Daily Fun-Wheel Bonus
        </CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-400">
          Spin for hidden tickets! 🎟️
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center px-6">
        {/* wheel + pointer */}
        <div className="relative w-72 h-72 mb-6 select-none hover:scale-[1.02] transition-transform duration-300">
          {/* 🟨 Pointer (star + triangle) placed OUTSIDE the wheel container */}
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
            aria-hidden="true"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full shadow-lg border-2 flex items-center justify-center",
                spinResult
                  ? "bg-yellow-500 border-yellow-300 animate-pulse shadow-glow"
                  : "bg-yellow-500 border-yellow-300",
              )}
            >
              <Star className="w-5 h-5 text-white" />
            </div>
            {/* ▼ yellow triangle */}
            <div
              className={cn(
                "w-0 h-0 border-x-8 border-b-[14px] border-x-transparent drop-shadow-lg",
                isSpinning && "animate-bounce",
                spinResult
                  ? "border-b-yellow-500 animate-pulse"
                  : "border-b-yellow-500",
              )}
            />
          </div>

          {/* wheel in overflow container */}
          <div
            className="w-full h-full rounded-full shadow-2xl overflow-hidden border-4 border-white dark:border-gray-700 ring-2 ring-gray-200 dark:ring-gray-600"
          >
            <div
              ref={wheelRef}
              onClick={!isSpinning ? handleSpin : undefined}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? "transform 8s cubic-bezier(0.2, 1, 0.3, 1)"
                  : undefined,
              }}
              className={cn(
                "w-full h-full rounded-full relative",
                isSpinning
                  ? "cursor-wait"
                  : "cursor-pointer hover:scale-[1.03]",
              )}
            >
              {/* SVG slices */}
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                {WHEEL_SEGMENTS.map((seg, i) => {
                  const LABEL_RADIUS = 38; // % of SVG radius
                  const start = i * SEGMENT_ANGLE - 90; // rotate to start at top
                  const end = start + SEGMENT_ANGLE;
                  const mid = start + SEGMENT_ANGLE / 2;

                  /* ➊ polar → cartesian */
                  const rad = (mid * Math.PI) / 180;
                  const x = 50 + LABEL_RADIUS * Math.cos(rad);
                  const y = 50 + LABEL_RADIUS * Math.sin(rad);

                  /* ➋ keep text upright: flip anything in the lower half-circle */
                  const flip = mid > 90 && mid < 270 ? 180 : 0;

                  return (
                    <g key={i} data-slice>
                      {/* slice wedge */}
                      <path
                        d={describeSlice(start, end)}
                        fill={seg.color}
                        stroke="#ffffff"
                        strokeWidth={0.4}
                      />
                      {/* label with explicit polar coordinates */}
                      <text
                        x={x}
                        y={y}
                        dominantBaseline="middle"
                        textAnchor="middle"
                        fontWeight="700"
                        fontSize="9"
                        fill={seg.text}
                        transform={`rotate(${flip} ${x} ${y})`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* hub */}
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center border-2 border-gray-300 dark:border-gray-600 shadow-xl",
                  isSpinning && "animate-pulse",
                )}
              >
                <Star className="w-4 h-4 text-yellow-500 mb-0.5" />
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">SPIN</span>
              </div>
            </div>
          </div>
        </div>

        {/* result */}
        {spinResult && (
          <div className="mb-6" aria-live="polite">
            <span className="inline-flex items-center gap-2 text-4xl font-bold bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 px-6 py-3 rounded-full border-2 border-yellow-400 dark:border-yellow-600 shadow-lg animate-pulse">
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">+{spinResult}</span>
              <span className="text-gray-700 dark:text-gray-300">tickets</span>
              <Star className="h-6 w-6 text-yellow-500 animate-spin" />
            </span>
          </div>
        )}

        {/* selectors */}
        <div className="grid gap-4 w-full max-w-md">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Select Child</label>
            <Select
              value={selectedChild}
              onValueChange={setSelectedChild}
              disabled={isSpinning}
            >
              <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <SelectValue placeholder="Choose a child..." />
              </SelectTrigger>
              <SelectContent>
                {childUsers.map((c: UserInfo) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Select Chore</label>
            <Select
              value={selectedChore}
              onValueChange={setSelectedChore}
              disabled={isSpinning || !selectedChild}
            >
              <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <SelectValue placeholder="Choose a chore..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(chores) &&
                  chores.map((ch: any) => (
                    <SelectItem key={ch.id} value={ch.id.toString()}>
                      {`${ch.name} (${ch.base_tickets})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3 px-6 pb-6 pt-2">
        {/* Show reset button if the wheel has been spun or is in error state */}
        {(rotation > 0 || spinResult) && (
          <Button 
            onClick={resetWheel} 
            variant="outline" 
            className="w-1/3 h-14 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border-gray-300 dark:border-gray-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        )}

        {/* Only show spin button if not currently spinning */}
        <Button
          onClick={handleSpin}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          disabled={isSpinning || !selectedChild || !selectedChore}
        >
          {isSpinning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Spinning...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-5 w-5 group-hover:animate-bounce" /> 
              SPIN THE WHEEL!
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
