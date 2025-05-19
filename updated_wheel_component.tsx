import { useState, useRef, useEffect, useCallback } from "react";
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
  { value: 3,  color: "#FFCE56", label: "3",  text: "#000" },
  { value: 5,  color: "#4BC0C0", label: "5",  text: "#fff" },
  { value: 2,  color: "#9966FF", label: "2",  text: "#fff" },
  { value: 3,  color: "#FF9F40", label: "3",  text: "#000" },
  { value: 10, color: "#FFCD56", label: "10", text: "#000" },
  { value: 1,  color: "#C9CBCF", label: "1",  text: "#000" },
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
    `M ${radius} ${radius}`,            // Move to center
    `L ${startX} ${startY}`,            // Line to start point
    `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`, // Arc to end point
    "Z",                                // Close path
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
  const celebrationAudioRef = useRef<HTMLAudioElement[]>([]);
  const tickAudioRef = useRef<HTMLAudioElement[]>([]);
  const tickTimer = useRef<NodeJS.Timeout>();
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  
  // Initialize audio context for fallback
  useEffect(() => {
    // Try to initialize audio context for fallback
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        setAudioCtx(new AudioContext());
      }
    } catch (e) {
      console.log('AudioContext not supported');
    }
    
    // Preload the wheel and celebration sounds to warm up the browser's audio engine
    const wheelSound = new Audio('/sounds/wheel.mp3?v=' + Date.now());
    const celebrationSound = new Audio('/sounds/celebration.mp3?v=' + Date.now());
    wheelSound.load();
    celebrationSound.load();
    
    return () => {
      if (audioCtx) {
        audioCtx.close().catch(e => console.log('Error closing AudioContext:', e));
      }
    };
  }, []);
  
  // Simple function to play the wheel sound
  const playTick = useCallback(() => {
    try {
      // Create a new audio element each time for overlapping sounds
      const audio = new Audio('/sounds/wheel.mp3?v=' + Date.now());
      audio.volume = 0.2;
      audio.play().catch(error => {
        console.log('Audio playback error:', error);
        
        // Fallback to simple tone if audio file fails
        if (audioCtx) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.frequency.value = 600;
          gain.gain.value = 0.2;
          osc.connect(gain).connect(audioCtx.destination);
          osc.start();
          setTimeout(() => osc.stop(), 50);
        }
      });
    } catch (error) {
      console.log('Audio playback error:', error);
    }
  }, [audioCtx]);
  
  /* ----- data --------------------------------------------------*/
  const childUsers = getChildUsers();
  const { data: chores = [] } = useQuery({ queryKey: ["/api/chores"], enabled: !isViewingAsChild() });
  
  // Mutation to assign bonus tickets
  const spinMutation = useMutation({
    mutationFn: (d: { user_id: number; chore_id: number }) =>
      apiRequest("/api/spin-wheel", { method: "POST", body: JSON.stringify(d) }),
    onSuccess: (data) => {
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
    
    // Start continuous wheel sound instead of ticking
    const wheelSound = new Audio('/sounds/wheel.mp3?v=' + Date.now());
    wheelSound.volume = 0.2;
    wheelSound.loop = true;
    tickAudioRef.current = [wheelSound];
    
    // Try to play continuous sound, fallback to ticks if it fails
    wheelSound.play().catch(error => {
      console.log('Could not play wheel sound:', error);
      // Fallback to tick sounds if continuous audio fails
      tickTimer.current = setInterval(playTick, 90);
    });
    
    /* 1️⃣ wind-up */
    setRotation((r) => r - 35);
    
    /* 2️⃣ main spin */
    setTimeout(() => {
      const idx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
      
      // Improved alignment math - center the slice at 270° (north where the pointer is)
      const FULL_SPINS = 12;
      const midPoint = idx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      const target = FULL_SPINS * 360 + 270 - midPoint; // ⭐ updated maths to align with pointer ⭐
      
      setRotation(target);
      
      /* send API mid-spin so DB is ready by landing */
      setTimeout(() => {
        spinMutation.mutate({ user_id: +selectedChild, chore_id: +selectedChore });
      }, 500);
      
      /* 3️⃣ on settle */
      setTimeout(() => {
        // Stop audio timer
        clearInterval(tickTimer.current!);
        
        // Stop the continuous wheel sound
        if (tickAudioRef.current.length > 0) {
          const audio = tickAudioRef.current[0];
          audio.pause();
          audio.currentTime = 0;
        } else {
          // If no audio in ref, ensure any interval is cleared
          clearInterval(tickTimer.current!);
        }
        
        setSpinResult(WHEEL_SEGMENTS[idx].value);
        
        // glow slice
        const slices = wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
        slices?.forEach((s, i) =>
          i === idx ? s.classList.add("ring-4", "ring-yellow-300", "animate-pulse") :
                      s.classList.remove("ring-4", "ring-yellow-300", "animate-pulse")
        );
        
        // haptic
        navigator.vibrate?.([50, 60, 50]);
        
        // celebratory sound for the win
        const celebrationSound = new Audio('/sounds/celebration.mp3?v=' + Date.now());
        celebrationSound.volume = 0.3;
        celebrationSound.play().catch(e => console.log('Could not play celebration sound'));
        
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
          {/* 🟨 Pointer (star + triangle) placed OUTSIDE the wheel container */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center" aria-hidden="true">
            <div className="w-9 h-9 rounded-full bg-yellow-500 shadow-lg border-2 border-yellow-300
                  flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            {/* ▼ yellow triangle */}
            <div className={cn(
              "w-0 h-0 border-x-8 border-b-[14px] border-x-transparent border-b-yellow-500 drop-shadow",
              isSpinning && "animate-bounce-slow"
            )} />
          </div>
          
          {/* wheel in overflow container */}
          <div className="w-full h-full rounded-full shadow-xl overflow-hidden" 
               style={{ border: "6px solid #fff", outline: "2px solid #ddd" }}>
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
          <div className="flex-1">
            <Select
              value={selectedChild}
              onValueChange={setSelectedChild}
              disabled={isSpinning}
            >
              <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
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
            <Select
              value={selectedChore}
              onValueChange={setSelectedChore}
              disabled={isSpinning || !selectedChild}
            >
              <SelectTrigger><SelectValue placeholder="Select chore" /></SelectTrigger>
              <SelectContent>
                {Array.isArray(chores) && chores.map((ch: any) => (
                  <SelectItem key={ch.id} value={ch.id.toString()}>
                    {`${ch.name} (${ch.tickets})`}
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
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
        )}
        
        {/* Only show spin button if not currently spinning */}
        <Button
          onClick={handleSpin}
          className="w-full py-6 text-lg bg-gradient-to-b from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 shadow-lg"
          disabled={isSpinning || !selectedChild || !selectedChore}
        >
          {isSpinning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Spinning...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-5 w-5" /> SPIN THE WHEEL!
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}