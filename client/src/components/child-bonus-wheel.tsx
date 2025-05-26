import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { useStatsStore } from "@/store/stats-store";
import {
  subscribeToChannel,
  createWebSocketConnection,
} from "@/lib/websocketClient";
import { Loader2, RefreshCw, Star, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

/* ------------------------------------------------------------------
   IMPROVED CHILD BONUS WHEEL 
   • Enhanced error handling and state management
   • Better accessibility and performance
   • Proper cleanup and memory management
   -----------------------------------------------------------------*/

/* ------ Types and Constants -------------------------------------*/
const WHEEL_SEGMENTS = [
  { value: 1, color: "#FF6384", label: "1", text: "#fff" },
  { value: 2, color: "#36A2EB", label: "2", text: "#fff" },
  { value: 3, color: "#FFCE56", label: "3", text: "#222" },
  { value: 5, color: "#4BC0C0", label: "5", text: "#fff" },
  { value: 2, color: "#9966FF", label: "2", text: "#fff" },
  { value: 10, color: "#FF9F40", label: "10", text: "#222" },
  { type: "double", color: "#FF66CC", label: "×2", text: "#fff" },
  { value: 4, color: "#7BC043", label: "4", text: "#fff" },
] as const;

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const SPIN_DURATION_MS = 8000; // Back to 8 seconds for dramatic effect
const WIND_UP_DURATION_MS = 300;
const FULL_SPINS = 12; // Back to 12 full rotations for a longer spin

type SpinState =
  | "idle"
  | "winding"
  | "spinning"
  | "settling"
  | "complete"
  | "error";

interface SpinStateData {
  state: SpinState;
  rotation: number;
  result: number | null;
  resultLabel: string | null;
  error: string | null;
  winningIndex: number | null;
}

type SpinAction =
  | { type: "START_WIND_UP" }
  | { type: "START_SPIN" }
  | {
      type: "SET_RESULT";
      payload: { tickets: number; index: number; label?: string };
    }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "SET_ROTATION"; payload: number };

function spinReducer(state: SpinStateData, action: SpinAction): SpinStateData {
  switch (action.type) {
    case "START_WIND_UP":
      return { ...state, state: "winding", rotation: state.rotation - 35 };
    case "START_SPIN":
      return { ...state, state: "spinning" };
    case "SET_RESULT":
      return {
        ...state,
        state: "complete",
        result: action.payload.tickets,
        resultLabel: action.payload.label || null,
        winningIndex: action.payload.index,
      };
    case "SET_ERROR":
      return { ...state, state: "error", error: action.payload };
    case "RESET":
      return {
        state: "idle",
        rotation: 0,
        result: null,
        resultLabel: null,
        error: null,
        winningIndex: null,
      };
    case "SET_ROTATION":
      return { ...state, rotation: action.payload };
    default:
      return state;
  }
}

/* ------ Helper Functions ----------------------------------------*/
function describeSlice(startAngle: number, endAngle: number, radius = 50) {
  const toRad = (deg: number) => (Math.PI / 180) * deg;
  const x1 = 50 + radius * Math.cos(toRad(startAngle));
  const y1 = 50 + radius * Math.sin(toRad(startAngle));
  const x2 = 50 + radius * Math.cos(toRad(endAngle));
  const y2 = 50 + radius * Math.sin(toRad(endAngle));

  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}

/* ------ Component Props -----------------------------------------*/
interface ChildBonusWheelProps {
  isOpen: boolean;
  onClose: () => void;
  dailyBonusId: number | null;
  childName: string;
  triggerType?: "chore_completion" | "good_behavior_reward" | "respin";
}

export function ChildBonusWheel({
  isOpen,
  onClose,
  dailyBonusId,
  childName,
  triggerType = "chore_completion",
}: ChildBonusWheelProps) {
  /* ----- State Management --------------------------------------*/
  const [spinState, dispatch] = useReducer(spinReducer, {
    state: "idle",
    rotation: 0,
    result: null,
    resultLabel: null,
    error: null,
    winningIndex: null,
  });
  
  // Version indicator for cache busting
  console.log("[WHEEL] Component version: 1.3 - Fixed race condition preventing 8s animation");

  const wheelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void)[]>([]);
  
  // Get auth state to check if parent is viewing as child
  const { user, originalUser, viewingChildId } = useAuthStore();
  const isParentViewingAsChild = !!originalUser && !!viewingChildId;
  
  // Get stats store for immediate balance updates
  const { updateBalance } = useStatsStore();

  /* ----- Audio Management --------------------------------------*/
  const audioRef = useRef<{
    context?: AudioContext;
    wheelSound?: HTMLAudioElement;
    celebrationSound?: HTMLAudioElement;
    tickInterval?: NodeJS.Timeout;
  }>({});

  // Initialize audio on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Preload wheel sound
        const wheelSound = new Audio("/sounds/wheelspin.mp3");
        wheelSound.volume = 0.3;
        await wheelSound.load();
        audioRef.current.wheelSound = wheelSound;

        // Preload celebration sound
        const celebrationSound = new Audio("/sounds/celebration.mp3");
        celebrationSound.volume = 0.4;
        await celebrationSound.load();
        audioRef.current.celebrationSound = celebrationSound;

        // Create audio context on user interaction
        if (!audioRef.current.context && typeof AudioContext !== "undefined") {
          audioRef.current.context = new AudioContext();
        }
      } catch (error) {
        console.warn("Audio initialization failed:", error);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (audioRef.current.context?.state === "running") {
        audioRef.current.context.close();
      }
      audioRef.current.wheelSound?.pause();
      audioRef.current.celebrationSound?.pause();
    };
  }, []);

  /* ----- Sound Effects -----------------------------------------*/
  const playTickSound = useCallback(() => {
    try {
      // Create a new audio instance for each tick to allow overlapping sounds
      const tickSound = new Audio("/sounds/tick.mp3");
      tickSound.volume = 0.2;
      tickSound.play().catch(() => {
        // Fallback to Web Audio API if audio playback fails
        if (audioRef.current.context) {
          const osc = audioRef.current.context.createOscillator();
          const gain = audioRef.current.context.createGain();
          osc.frequency.value = 820;
          gain.gain.value = 0.15;
          osc.connect(gain).connect(audioRef.current.context.destination);
          osc.start();
          osc.stop(audioRef.current.context.currentTime + 0.03);
        }
      });
    } catch (error) {
      // Silently fail - audio is not critical
    }
  }, []);

  const playCelebrationSound = useCallback(() => {
    try {
      audioRef.current.celebrationSound?.play().catch(() => {});
    } catch (error) {
      // Silently fail
    }
  }, []);

  /* ----- Progressive Tick Interval -----------------------------*/
  const startTickSound = useCallback(() => {
    const startTime = Date.now();

    const updateTickInterval = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > SPIN_DURATION_MS / 1000 || spinState.state !== "spinning") {
        if (audioRef.current.tickInterval) {
          clearInterval(audioRef.current.tickInterval);
          audioRef.current.tickInterval = undefined;
        }
        return;
      }

      // Progressive interval - starts fast, slows down
      const interval = Math.max(30, 90 - elapsed * 8);

      if (audioRef.current.tickInterval) {
        clearInterval(audioRef.current.tickInterval);
      }

      audioRef.current.tickInterval = setInterval(playTickSound, interval);
      requestAnimationFrame(updateTickInterval);
    };

    // Start with fast ticks
    audioRef.current.tickInterval = setInterval(playTickSound, 40);
    requestAnimationFrame(updateTickInterval);

    // Register cleanup
    cleanupRef.current.push(() => {
      if (audioRef.current.tickInterval) {
        clearInterval(audioRef.current.tickInterval);
        audioRef.current.tickInterval = undefined;
      }
    });
  }, [playTickSound, spinState.state]);

  /* ----- WebSocket Handlers ------------------------------------*/
  useEffect(() => {
    if (!isOpen || !dailyBonusId) return;

    createWebSocketConnection();

    const bonusSpinListener = subscribeToChannel(
      "bonus_spin:result",
      (eventData) => {
        if (eventData.data?.daily_bonus_id === dailyBonusId) {
          // Update UI with real-time result if needed
          console.log("Bonus spin result received:", eventData.data);
        }
      },
    );

    const transactionListener = subscribeToChannel(
      "transaction:earn",
      (eventData) => {
        if (eventData.data?.metadata?.daily_bonus_id === dailyBonusId) {
          // Immediately update balance in cache for instant UI update
          const ticketAmount = eventData.data?.delta_tickets || 0;
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            if (!oldData) return oldData;
            const newBalance = (oldData.balance || 0) + ticketAmount;
            
            // Also update the stats store
            updateBalance(newBalance);
            
            return {
              ...oldData,
              balance: newBalance,
            };
          });
          
          // Then refresh for consistency
          queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        }
      },
    );

    return () => {
      bonusSpinListener();
      transactionListener();
    };
  }, [isOpen, dailyBonusId, queryClient, updateBalance]);

  /* ----- Spin Mutation -----------------------------------------*/
  const spinMutation = useMutation({
    mutationFn: () => {
      // If parent is viewing as child, send the child's userId
      const requestBody = isParentViewingAsChild && viewingChildId 
        ? { userId: viewingChildId }
        : {};
      
      const payload = { 
        daily_bonus_id: dailyBonusId,
        ...requestBody 
      };
      
      console.log("[BONUS_SPIN] Auth state:", { 
        user, 
        originalUser, 
        viewingChildId, 
        isParentViewingAsChild,
        requestBody,
        dailyBonusId,
        payload 
      });
        
      return apiRequest("/api/bonus/spin", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      const serverSegmentIndex = data.segment_index;
      const winningSegment = WHEEL_SEGMENTS[serverSegmentIndex];

      // Calculate the final landing position
      const segmentCenter =
        serverSegmentIndex * SEGMENT_ANGLE - 90 + SEGMENT_ANGLE / 2;
      const jitterRange = SEGMENT_ANGLE / 2 - 4;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      const targetAngle = 270 - segmentCenter + jitter;
      
      // Calculate total rotation: full spins + landing angle
      const finalRotation = (FULL_SPINS * 360) + targetAngle;
      
      // Debug logging
      console.log("[WHEEL] Server response received:", {
        serverSegmentIndex,
        finalRotation,
        currentState: spinState.state,
        currentRotation: spinState.rotation
      });
      
      // Immediately set the final rotation for faster response
      console.log("[WHEEL] Setting final rotation:", finalRotation);
      dispatch({ type: "SET_ROTATION", payload: finalRotation });
      
      // Immediately update the balance and show result (don't wait for animation)
      if (data.balance !== undefined) {
        queryClient.setQueryData(["/api/stats"], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            balance: data.balance,
          };
        });
        
        // Also update the stats store for immediate UI update
        updateBalance(data.balance);
      }
      
      // Store result data but don't dispatch SET_RESULT yet
      const isMultiplier = "type" in winningSegment && winningSegment.type === "double";
      const resultPayload = {
        tickets: data.tickets_awarded,
        index: serverSegmentIndex,
        label: isMultiplier ? "×2" : undefined,
      };
      
      // Immediately update queries for faster UI refresh
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

      // The celebration should happen after the full spin duration
      // since we're starting the animation fresh when server responds
      
      // After animation completes, do celebration effects
      const celebrationTimeout = setTimeout(() => {
        // Now that animation is complete, show the result
        dispatch({
          type: "SET_RESULT",
          payload: resultPayload,
        });

        // Highlight winning segment
        const slices =
          wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
        slices?.forEach((slice, i) => {
          if (i === serverSegmentIndex) {
            slice.classList.add("ring-4", "ring-yellow-300", "animate-pulse");
          } else {
            slice.classList.remove(
              "ring-4",
              "ring-yellow-300",
              "animate-pulse",
            );
          }
        });

        // Celebration effects
        playCelebrationSound();

        if (navigator.vibrate) {
          navigator.vibrate([50, 60, 50]);
        }

        if (data.tickets_awarded >= 10) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        }

        toast({
          title: "🎊 Bonus Spin Complete!",
          description: `You won ${data.tickets_awarded} tickets!`,
          className: "bg-yellow-50 border-yellow-200 text-yellow-900",
        });

      }, SPIN_DURATION_MS);

      cleanupRef.current.push(() => clearTimeout(celebrationTimeout));
    },
    onError: (error: any) => {
      dispatch({ type: "SET_ERROR", payload: error.message || "Spin failed" });

      toast({
        title: "Spin Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  /* ----- Spin Handler ------------------------------------------*/
  const handleSpin = useCallback(() => {
    if (!dailyBonusId) {
      toast({
        title: "Error",
        description: "Missing bonus information",
        variant: "destructive",
      });
      return;
    }

    // Play wheel spin sound on user interaction
    try {
      if (audioRef.current.wheelSound) {
        audioRef.current.wheelSound.currentTime = 0;
        audioRef.current.wheelSound.play().catch((err) => {
          console.log("Could not play wheel sound:", err);
        });
      }
    } catch (error) {
      console.log("Audio playback error:", error);
    }

    // Wind up animation
    dispatch({ type: "START_WIND_UP" });

    setTimeout(() => {
      console.log("[WHEEL] Starting spin sequence");
      dispatch({ type: "START_SPIN" });
      startTickSound();

      // Don't set rotation yet - wait for server to tell us where to land
      // This ensures one smooth, uninterrupted animation
      console.log("[WHEEL] Making API call");

      // Make API call
      spinMutation.mutate();
    }, WIND_UP_DURATION_MS);
  }, [dailyBonusId, spinMutation, startTickSound]);

  /* ----- Reset on Close ----------------------------------------*/
  useEffect(() => {
    if (!isOpen) {
      // Cleanup all timeouts and intervals
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];

      // Reset state
      dispatch({ type: "RESET" });

      // Stop audio
      if (audioRef.current.wheelSound) {
        audioRef.current.wheelSound.pause();
        audioRef.current.wheelSound.currentTime = 0;
      }

      // Clear wheel highlights
      const slices =
        wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
      slices?.forEach((s) =>
        s.classList.remove("ring-4", "ring-yellow-300", "animate-pulse"),
      );
    }
  }, [isOpen]);

  /* ----- Memoized Wheel Segments -------------------------------*/
  const wheelSegments = useMemo(
    () =>
      WHEEL_SEGMENTS.map((seg, i) => {
        const start = i * SEGMENT_ANGLE - 90;
        const end = start + SEGMENT_ANGLE;
        const mid = start + SEGMENT_ANGLE / 2;
        const flip = mid > 90 && mid < 270 ? 180 : 0;

        const LABEL_R = 38;
        const rad = (mid * Math.PI) / 180;
        const xLab = 50 + LABEL_R * Math.cos(rad);
        const yLab = 50 + LABEL_R * Math.sin(rad);

        return (
          <g key={i} data-slice>
            <path
              d={describeSlice(start, end)}
              fill={seg.color}
              stroke="#ffffff"
              strokeWidth={0.4}
            />
            <text
              x={xLab}
              y={yLab}
              dominantBaseline="middle"
              textAnchor="middle"
              fontWeight="700"
              fontSize="9"
              fill={seg.text}
              transform={`rotate(${flip} ${xLab} ${yLab})`}
            >
              {seg.label}
            </text>
          </g>
        );
      }),
    [],
  );

  const isSpinning =
    spinState.state === "spinning" || spinState.state === "winding";
  const showResult =
    spinState.state === "complete" && spinState.result !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {childName}'s Bonus Wheel Spin
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {/* Wheel Container */}
          <div className="relative w-72 h-72 mb-6 select-none overflow-visible">
            {/* Pointer */}
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
              aria-hidden="true"
            >
              <div
                className={cn(
                  "w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300 transition-all",
                  isSpinning && "animate-bounce shadow-glow",
                )}
              >
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[15px] border-transparent border-t-yellow-600" />
            </div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              style={{
                transform: `rotate(${spinState.rotation}deg)`,
                transition: spinState.state === "spinning"
                  ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(.12,.98,.26,1)`
                  : undefined,
              }}
              className={cn(
                "w-full h-full rounded-full shadow-xl relative",
                isSpinning && "blur-[0.5px]", // Subtle motion blur
              )}
              role="img"
              aria-label="Bonus wheel with prize segments"
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                {wheelSegments}
              </svg>

              {/* Hub */}
              <div
                className={cn(
                  "absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2",
                  "rounded-full bg-gradient-to-b from-white to-gray-200",
                  "flex flex-col items-center justify-center",
                  "border-2 border-gray-300 shadow-lg transition-all",
                  isSpinning && "scale-110",
                )}
              >
                <Star className="w-4 h-4 text-yellow-500 mb-0.5" />
                <span className="font-bold text-gray-800 text-sm">SPIN</span>
              </div>
            </div>
          </div>

          {/* Error State */}
          {spinState.state === "error" && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{spinState.error}</span>
            </div>
          )}

          {/* Result Display */}
          {showResult && (
            <div
              className="mb-6"
              role="status"
              aria-live="assertive"
              aria-label={`You won ${spinState.result} tickets`}
            >
              <span className="inline-flex items-center gap-1 text-4xl font-bold bg-white/80 px-6 py-3 rounded-full border-2 border-pink-400 shadow">
                {spinState.resultLabel ? (
                  <>
                    <span className="text-pink-500">
                      {spinState.resultLabel}
                    </span>
                    <span className="text-yellow-500">
                      = {spinState.result}
                    </span>
                  </>
                ) : (
                  <span className="text-yellow-500">+{spinState.result}</span>
                )}
                <span className="text-purple-600">tickets</span>
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          {!showResult && (
            <Button
              onClick={handleSpin}
              disabled={isSpinning || spinMutation.isPending || !dailyBonusId}
              className={cn(
                "flex-1 text-lg font-bold py-6",
                isSpinning
                  ? "bg-gray-500/80 cursor-wait"
                  : "bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 hover:shadow-lg transform hover:scale-105 transition-all",
              )}
              aria-label="Spin the bonus wheel"
            >
              {isSpinning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Spinning…
                </>
              ) : spinState.state === "error" ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Try Again
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  SPIN THE WHEEL!
                </>
              )}
            </Button>
          )}

          {showResult && (
            <Button
              onClick={onClose}
              className="flex-1 py-6 bg-green-500 hover:bg-green-600 transform hover:scale-105 transition-all"
              autoFocus
            >
              Awesome! Got it!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
