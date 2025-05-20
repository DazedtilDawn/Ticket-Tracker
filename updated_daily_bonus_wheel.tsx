import { useState, useRef } from "react";
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
import {
  Loader2,
  RefreshCw,
  Star,
  Rocket,
  Volume2,
} from "lucide-react";
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
  profile_image_url?: string | null;
}

/* ------ wheel configuration -------------------------------------*/
const WHEEL_SEGMENTS = [
  { value: 1,  color: "#FF6384", label: "1",  text: "#fff" },
  { value: 2,  color: "#36A2EB", label: "2",  text: "#fff" },
  { value: 3,  color: "#FFCE56", label: "3",  text: "#222" },
  { value: 5,  color: "#4BC0C0", label: "5",  text: "#fff" },
  { value: 2,  color: "#9966FF", label: "2",  text: "#fff" },
  { value: 10, color: "#FF9F40", label: "10", text: "#222" },
  { value: 3,  color: "#FF66CC", label: "3",  text: "#fff" },
  { value: 4,  color: "#7BC043", label: "4",  text: "#fff" },
];

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;          // 45°

/* ------ helper for SVG arc path ---------------------------------*/
function describeSlice(startAngle: number, endAngle: number, radius = 50) {
  const toRad = (deg: number) => (Math.PI / 180) * deg;
  const x1 = 50 + radius * Math.cos(toRad(startAngle));
  const y1 = 50 + radius * Math.sin(toRad(startAngle));
  const x2 = 50 + radius * Math.cos(toRad(endAngle));
  const y2 = 50 + radius * Math.sin(toRad(endAngle));

  return `
    M 50 50
    L ${x1} ${y1}
    A ${radius} ${radius} 0 0 1 ${x2} ${y2}
    Z
  `;
}

export function DailyBonusWheel() {
  const { isViewingAsChild, getChildUsers } = useAuthStore();

  /* ----- local UI state ----------------------------------------*/
  const [selectedChild, setSelectedChild] = useState("");
  const [selectedChore, setSelectedChore] = useState("");
  const [isSpinning, setIsSpinning]   = useState(false);
  const [spinResult, setSpinResult]   = useState<number | null>(null);
  const [rotation, setRotation]       = useState(0); // deg
  const [showResult, setShowResult]   = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  /* ----- reset function for wheel state -----------------------*/
  const resetWheel = () => {
    setRotation(0);
    setIsSpinning(false);
    setSpinResult(null);
    setShowResult(false);
    
    // Reset any wheel slice highlights
    const slices = wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
    slices?.forEach(s => s.classList.remove("ring-4", "ring-yellow-300", "animate-pulse"));
    
    // Also reset the daily bonus in the database if a child is selected
    if (selectedChild) {
      resetBonusMutation.mutate(parseInt(selectedChild));
    }
  };

  /* ----- audio tick -------------------------------------------*/
  const audioCtxRef = useRef<AudioContext>();
  const tickTimer   = useRef<NodeJS.Timeout>();
  const playTick = () => {
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 820;
      gain.gain.value = 0.15;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 30);
    } catch (_) {/* ignore */ }
  };

  /* ----- data --------------------------------------------------*/
  const childUsers = getChildUsers();
  const { data: chores = [] } = useQuery({ queryKey: ["/api/chores"], enabled: !isViewingAsChild() });

  const spinMutation = useMutation({
    mutationFn: (d: { user_id: number; chore_id: number }) =>
      apiRequest("/api/spin-wheel", { method: "POST", body: JSON.stringify(d) }),
    onSuccess: (data) => {
      setTimeout(() => {
        toast({
          title: "🎊 Wheel spun!",
          description: `+${data.daily_bonus.bonus_tickets} tickets awarded.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        setTimeout(() => {
          setIsSpinning(false);
          setSpinResult(null);
        }, 3000);
      }, 8000);
    },
    onError: (err: any) => {
      clearInterval(tickTimer.current!);
      
      // Check if error says "already has a daily bonus assigned"
      if (err.message && err.message.includes("already has a daily bonus")) {
        // Show a more helpful error message about using the reset button
        toast({
          title: "Bonus Already Assigned",
          description: "Use the Reset button to clear the bonus and try again.",
          variant: "default",
        });
      } else {
        toast({
          title: "Spin error",
          description: err.message || "Couldn't spin wheel.",
          variant: "destructive",
        });
      }
      
      setIsSpinning(false);
    },
  });
  
  // Mutation to reset the daily bonus
  const resetBonusMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("/api/reset-daily-bonus", { method: "POST", body: JSON.stringify({ user_id: userId }) }),
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

  /* ----- spin handler -----------------------------------------*/
  const handleSpin = () => {
    if (!selectedChild || !selectedChore) {
      toast({ title: "Select child & chore first", variant: "destructive" });
      return;
    }

    setIsSpinning(true);
    tickTimer.current = setInterval(playTick, 90);

    /* 1️⃣ wind-up */
    setRotation((r) => r - 35);

    /* 2️⃣ main spin */
    setTimeout(() => {
      const idx   = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
      const target = 360 * 12 + idx * SEGMENT_ANGLE;       // 12 full rotations
      setRotation(target);

      /* send API mid-spin so DB is ready by landing */
      setTimeout(() => {
        spinMutation.mutate({ user_id: +selectedChild, chore_id: +selectedChore });
      }, 500);

      /* 3️⃣ on settle */
      setTimeout(() => {
        clearInterval(tickTimer.current!);
        setSpinResult(WHEEL_SEGMENTS[idx].value);

        // glow slice
        const slices = wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
        slices?.forEach((s, i) =>
          i === idx ? s.classList.add("ring-4", "ring-yellow-300", "animate-pulse") :
                      s.classList.remove("ring-4", "ring-yellow-300", "animate-pulse")
        );

        // haptic
        navigator.vibrate?.([50, 60, 50]);

        // confetti for 10
        if (WHEEL_SEGMENTS[idx].value === 10) {
          import("canvas-confetti").then((m) =>
            m.default({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
          );
        }
      }, 7800);
    }, 300);
  };

  if (isViewingAsChild()) return null;

  /* ----- render ------------------------------------------------*/
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Daily Fun-Wheel Bonus</CardTitle>
        <CardDescription className="text-center">Spin for hidden tickets!</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center">
        {/* wheel + pointer */}
        <div className="relative w-72 h-72 mb-6 select-none">
          {/* pointer */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-transparent border-t-yellow-600" />
          </div>

          {/* wheel */}
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
              "w-full h-full rounded-full shadow-xl relative",
              isSpinning ? "cursor-wait" : "cursor-pointer hover:scale-[1.03]"
            )}
          >
            {/* SVG slices */}
            <svg viewBox="0 0 100 100" className="absolute inset-0">
              {WHEEL_SEGMENTS.map((seg, i) => {
                const start = i * SEGMENT_ANGLE - 90;               // rotate to start at top
                const end   = start + SEGMENT_ANGLE;
                const mid   = start + SEGMENT_ANGLE / 2;

                return (
                  <g key={i} data-slice>
                    {/* slice wedge */}
                    <path
                      d={describeSlice(start, end)}
                      fill={seg.color}
                      stroke="#ffffff"
                      strokeWidth={0.4}
                    />
                    {/* label positioned at 42% radius */}
                    <text
                      x={50}
                      y={50}
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fontWeight="700"
                      fontSize="9"
                      fill={seg.text}
                      transform={`rotate(${mid} 50 50) translate(0 -42) rotate(${-mid} 50 50)`}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* hub */}
            <div className={cn(
              "absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-white to-gray-200 flex flex-col items-center justify-center border-2 border-gray-300 shadow-lg",
              isSpinning && "animate-ping-slow"
            )}>
              <Star className="w-4 h-4 text-yellow-500 mb-0.5" />
              <span className="font-bold text-gray-800 text-sm">SPIN</span>
            </div>
          </div>
        </div>

        {/* result */}
        {spinResult && (
          <div className="mb-6" aria-live="polite">
            <span className="inline-flex items-center gap-1 text-4xl font-bold bg-white/80 px-6 py-3 rounded-full border-2 border-pink-400 shadow">
              <span className="text-yellow-500">+{spinResult}</span>
              <span className="text-purple-600">tickets</span>
            </span>
          </div>
        )}

        {/* selectors */}
        <div className="grid gap-4 w-full max-w-md">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Child</label>
            <Select 
              value={selectedChild} 
              onValueChange={(value) => {
                setSelectedChild(value);
                resetWheel(); // Reset wheel when child changes
              }} 
              disabled={isSpinning}>
              <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
              <SelectContent>
                {childUsers.map((c: UserInfo) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Chore</label>
            <Select 
              value={selectedChore} 
              onValueChange={(value) => {
                setSelectedChore(value);
                resetWheel(); // Reset wheel when chore changes
              }} 
              disabled={isSpinning}>
              <SelectTrigger><SelectValue placeholder="Select chore" /></SelectTrigger>
              <SelectContent>
                {Array.isArray(chores) && chores.map((ch: any) => (
                  <SelectItem key={ch.id} value={ch.id.toString()}>
                    {`${ch.name} (${ch.base_tickets})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        {/* Show reset button if the wheel has been spun or is in error state */}
        {(rotation > 0 || spinResult) && (
          <Button
            onClick={resetWheel}
            variant="outline"
            className="w-1/3 py-6"
          >
            <RefreshCw className="mr-2 h-5 w-5" /> Reset
          </Button>
        )}
        
        <Button
          onClick={handleSpin}
          disabled={isSpinning || spinMutation.isPending || !selectedChild || !selectedChore}
          className={cn(
            "flex-1 text-lg font-bold py-6",
            isSpinning
              ? "bg-gray-500/80 cursor-wait"
              : "bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 hover:shadow-lg"
          )}
        >
          {isSpinning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Spinning…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" /> Spin the Lucky Wheel!
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}