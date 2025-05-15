import { useState, useRef, useEffect } from "react";
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
import { subscribeToChannel, createWebSocketConnection } from "@/lib/supabase";
import {
  Loader2,
  RefreshCw,
  Star,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

/* ------------------------------------------------------------------
   CHILD BONUS WHEEL 
   • For use when a child completes a bonus chore
   • Direct spin mode - no child or chore selection needed
   • Auto-calls /api/bonus-spin with the provided dailyBonusId
   -----------------------------------------------------------------*/

/* ------ wheel configuration -------------------------------------*/
const WHEEL_SEGMENTS = [
  { value: 1,  color: "#FF6384", label: "1",  text: "#fff" },
  { value: 2,  color: "#36A2EB", label: "2",  text: "#fff" },
  { value: 3,  color: "#FFCE56", label: "3",  text: "#222" },
  { value: 5,  color: "#4BC0C0", label: "5",  text: "#fff" },
  { value: 2,  color: "#9966FF", label: "2",  text: "#fff" },
  { value: 10, color: "#FF9F40", label: "10", text: "#222" },
  { type: "multiplier", value: "double", multiplier: 2, color: "#FF66CC", label: "×2", text: "#fff" },
  { value: 4,  color: "#7BC043", label: "4",  text: "#fff" },
  { value: "respin", color: "#4CAF50", label: "Spin Again", text: "#fff" },
];

const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

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

interface ChildBonusWheelProps {
  isOpen: boolean;
  onClose: () => void;
  dailyBonusId: number | null;
  childName: string;
}

export function ChildBonusWheel({
  isOpen,
  onClose,
  dailyBonusId,
  childName
}: ChildBonusWheelProps) {
  /* ----- local UI state ----------------------------------------*/
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [resultLabel, setResultLabel] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0); // deg
  const [showResult, setShowResult] = useState(false);
  const [pendingMultiplier, setPendingMultiplier] = useState<number>(1);
  const wheelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  /* ----- audio tick -------------------------------------------*/
  const audioCtxRef = useRef<AudioContext>();
  const tickTimer = useRef<NodeJS.Timeout>();
  const wheelAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio files
  useEffect(() => {
    // Preload the wheel sound for better performance
    if (!wheelAudioRef.current) {
      wheelAudioRef.current = new Audio('/sounds/wheelspin.mp3');
      wheelAudioRef.current.volume = 0.3;
      
      // Preload by forcing a load operation
      wheelAudioRef.current.load();
    }
    
    return () => {
      if (wheelAudioRef.current) {
        wheelAudioRef.current.pause();
        wheelAudioRef.current = null;
      }
    };
  }, []);
  
  const playTick = () => {
    try {
      // Try to play actual wheel sound first
      if (wheelAudioRef.current) {
        if (wheelAudioRef.current.paused) {
          wheelAudioRef.current.play().catch(() => {
            // Fallback to Web Audio if playback fails
            useWebAudioTick();
          });
        }
        return;
      }
      
      // Fallback to Web Audio API
      useWebAudioTick();
    } catch (_) {/* ignore */ }
  };
  
  const useWebAudioTick = () => {
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

  // Reset wheel state when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setRotation(0);
      setIsSpinning(false);
      setSpinResult(null);
      setShowResult(false);
      
      // Stop any audio playing
      if (wheelAudioRef.current) {
        wheelAudioRef.current.pause();
        wheelAudioRef.current.currentTime = 0;
      }
      
      // Clear the tick timer if it's running
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
        tickTimer.current = undefined;
      }
      
      // Reset any wheel slice highlights
      const slices = wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
      slices?.forEach(s => s.classList.remove("ring-4", "ring-yellow-300", "animate-pulse"));
    }
  }, [isOpen]);
  
  // Set up WebSocket listeners for bonus spin results
  useEffect(() => {
    console.log('[WHEEL_DEBUG] Setting up WebSocket listeners for bonus spin events');
    
    // Ensure we have an active WebSocket connection
    createWebSocketConnection();
    
    // Listen for bonus_spin:result events
    const bonusSpinListener = subscribeToChannel("bonus_spin:result", (eventData) => {
      console.log('[WHEEL_DEBUG] Received bonus_spin:result WebSocket event:', eventData);
      
      // Only process events for our bonus ID
      if (dailyBonusId && eventData.data?.daily_bonus_id === dailyBonusId) {
        console.log('[WHEEL_DEBUG] Processing matching bonus_spin:result for our dailyBonusId:', dailyBonusId);
      }
    });
    
    // Listen for transaction:earn events that might be related to our bonus
    const transactionListener = subscribeToChannel("transaction:earn", (eventData) => {
      if (dailyBonusId && eventData.data?.data?.source === "bonus_spin" && 
          eventData.data?.data?.ref_id === dailyBonusId) {
        console.log('[WHEEL_DEBUG] Received transaction from our bonus spin:', eventData);
      }
    });
    
    // Generic listener to catch all events (for debugging)
    const allEventsListener = subscribeToChannel("", (eventData) => {
      console.log('[WHEEL_DEBUG] Received any WebSocket event:', eventData.event);
    });
    
    // Cleanup listeners on unmount
    return () => {
      bonusSpinListener();
      transactionListener();
      allEventsListener();
    };
  }, [dailyBonusId, isOpen]);

  const spinMutation = useMutation({
    mutationFn: (bonusId: number) =>
      apiRequest("/api/bonus-spin", { 
        method: "POST", 
        body: JSON.stringify({ daily_bonus_id: bonusId })
      }),
    onSuccess: (data) => {
      console.log('[WHEEL_DEBUG] Spin mutation success response:', data);
      
      // Get the server-assigned segment index and adjust wheel position to match it
      const serverSegmentIndex = data.segment_index;
      console.log('[WHEEL_DEBUG] Server assigned segment index:', serverSegmentIndex);
      
      // Calculate the final rotation to land on the winning segment
      const FULL_SPINS = 12;
      const midPoint = serverSegmentIndex * SEGMENT_ANGLE - 90 + SEGMENT_ANGLE / 2; //° of slice centre
      const JITTER_RANGE = SEGMENT_ANGLE / 2 - 4;                  // keep 4° from edge
      const jitter = (Math.random() - 0.5) * 2 * JITTER_RANGE;
      // 0° (north) + 270° offset minus the slice-centre brings it under the pointer
      const finalRotation = FULL_SPINS * 360 + 270 - midPoint + jitter;
      console.log('[WHEEL_DEBUG] Setting final rotation to:', finalRotation);
      
      // Apply the final rotation that will correctly land on the server-chosen segment
      setRotation(finalRotation);
      
      // Show the result after the wheel stops
      setTimeout(() => {
        console.log('[WHEEL_DEBUG] Animation finished, setting result with tickets:', data.tickets_awarded);
        setSpinResult(data.tickets_awarded);
        
        // Get the segment that was landed on to determine if it was a multiplier
        const winningSegment = WHEEL_SEGMENTS[data.segment_index];
        const isMultiplier = winningSegment.type === "double";
        
        // Set a custom result label for multipliers
        if (isMultiplier) {
          console.log('[WHEEL_DEBUG] Landed on multiplier segment');
          setResultLabel('×2');
        } else {
          setResultLabel(null);
        }
        
        // Highlight the winning slice
        const slices = wheelRef.current?.querySelectorAll<HTMLElement>("[data-slice]");
        console.log('[WHEEL_DEBUG] Found wheel slices:', slices?.length || 0);
        
        if (slices) {
          slices.forEach((s, i) => {
            if (i === data.segment_index) {
              console.log('[WHEEL_DEBUG] Highlighting winning slice at index', i);
              s.classList.add("ring-4", "ring-yellow-300", "animate-pulse");
            } else {
              s.classList.remove("ring-4", "ring-yellow-300", "animate-pulse");
            }
          });
        } else {
          console.error('[WHEEL_DEBUG] ERROR: Could not find wheel slices to highlight');
        }
        
        // Play celebration sound
        try {
          const celebrationAudio = new Audio('/sounds/celebration.mp3');
          celebrationAudio.volume = 0.4;
          celebrationAudio.play().catch(err => {
            console.log('[WHEEL_DEBUG] Could not play celebration sound:', err);
          });
        } catch (err) {
          console.log('[WHEEL_DEBUG] Error setting up celebration sound:', err);
        }
        
        // Vibration feedback if available
        if (navigator.vibrate) {
          console.log('[WHEEL_DEBUG] Triggering device vibration');
          navigator.vibrate([50, 60, 50]);
        }
        
        // Confetti for 10 tickets
        if (data.tickets_awarded >= 10) {
          console.log('[WHEEL_DEBUG] Triggering confetti for high ticket win');
          confetti({ 
            particleCount: 120, 
            spread: 80, 
            origin: { y: 0.6 } 
          });
        }
        
        // Show toast with the result
        console.log('[WHEEL_DEBUG] Showing success toast with', data.tickets_awarded, 'tickets');
        toast({
          title: "🎊 Bonus Spin Complete!",
          description: `You won ${data.tickets_awarded} tickets!`,
          className: "bg-yellow-50 border-yellow-200 text-yellow-900",
        });
        
        // Refresh data to update ticket balance
        console.log('[WHEEL_DEBUG] Invalidating queries to refresh UI data');
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        
        // Allow user to close the modal after seeing the result
        setIsSpinning(false);
        console.log('[WHEEL_DEBUG] Spin animation and process complete');
      }, 8000);
    },
    onError: (err: any) => {
      console.error('[WHEEL_DEBUG] Spin mutation error:', err);
      clearInterval(tickTimer.current!);
      
      toast({
        title: "Spin Error",
        description: err.message || "Something went wrong when spinning the wheel.",
        variant: "destructive",
      });
      
      setIsSpinning(false);
    },
  });

  /* ----- spin handler -----------------------------------------*/
  const handleSpin = () => {
    console.log('[WHEEL_DEBUG] Spin button clicked with dailyBonusId:', dailyBonusId);
    
    if (!dailyBonusId) {
      console.log('[WHEEL_DEBUG] Error: Missing dailyBonusId');
      toast({ 
        title: "Error", 
        description: "Missing bonus information", 
        variant: "destructive" 
      });
      return;
    }

    console.log('[WHEEL_DEBUG] Starting wheel spin animation for bonus ID:', dailyBonusId);
    setIsSpinning(true);
    
    // Use progressive tick interval that matches wheel physics
    const startTime = Date.now();
    const SPIN_DURATION = 8; // seconds
    
    const updateTickInterval = () => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      if (elapsed > SPIN_DURATION || !isSpinning) return;
      
      // Interval varies based on spin phase (starts fast, slows gradually)
      const interval = Math.max(30, 90 - elapsed * 8);
      
      if (tickTimer.current) {
        clearInterval(tickTimer.current);
      }
      
      tickTimer.current = setInterval(playTick, interval);
      requestAnimationFrame(updateTickInterval);
    };
    
    // Start with fast ticks
    tickTimer.current = setInterval(playTick, 40);
    // Begin the progressive update
    requestAnimationFrame(updateTickInterval);

    /* Wind-up */
    console.log('[WHEEL_DEBUG] Applying wind-up animation');
    setRotation((r) => r - 35);

    /* Send API call first to get the real segment index */
    setTimeout(() => {
      console.log('[WHEEL_DEBUG] Making API call to /api/bonus-spin with ID:', dailyBonusId);
      
      // Send request to /api/bonus-spin to get the actual segment index
      spinMutation.mutate(dailyBonusId);
      
      // Start the wheel spin immediately with a temporary rotation
      // The final rotation will be set in the onSuccess handler based on server response
      const initialTarget = 360 * 5; // Start with 5 rotations
      console.log('[WHEEL_DEBUG] Starting initial spin animation');
      setRotation(initialTarget);
      
      /* On settle, clear tick sound */
      setTimeout(() => {
        console.log('[WHEEL_DEBUG] Wheel spin animation completing, clearing tick sound');
        clearInterval(tickTimer.current!);
        
        // Also stop any playing audio
        if (wheelAudioRef.current) {
          wheelAudioRef.current.pause();
          wheelAudioRef.current.currentTime = 0;
        }
      }, 7800);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {childName}'s Bonus Wheel Spin
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {/* wheel + pointer */}
          <div className="relative w-72 h-72 mb-6 select-none overflow-visible">
            {/* pointer */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300",
                isSpinning && "animate-bounce-slow shadow-glow"
              )}>
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[15px] border-transparent border-t-yellow-600" />
            </div>

            {/* wheel */}
            <div
              ref={wheelRef}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? "transform 8s cubic-bezier(.12,.98,.26,1)"
                  : undefined,
              }}
              className={cn(
                "w-full h-full rounded-full shadow-xl relative",
                isSpinning ? "cursor-wait" : "cursor-default"
              )}
            >
              {/* SVG slices */}
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                {WHEEL_SEGMENTS.map((seg, i) => {
                  const start = i * SEGMENT_ANGLE - 90; // rotate to start at top
                  const end = start + SEGMENT_ANGLE;
                  const mid = start + SEGMENT_ANGLE / 2;
                  
                  // Apply 180° flip to bottom half labels (90-270° range)
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
                      {/* label positioned at fixed radius with direct x,y coordinates */}
                      {(() => {
                        const LABEL_R = 38;                       // % of SVG radius
                        const rad = (mid * Math.PI) / 180;
                        const xLab = 50 + LABEL_R * Math.cos(rad);
                        const yLab = 50 + LABEL_R * Math.sin(rad);
                        
                        return (
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
                        );
                      })()}
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
                {resultLabel ? (
                  <>
                    <span className="text-pink-500">{resultLabel}</span>
                    <span className="text-yellow-500">= {spinResult}</span>
                  </>
                ) : (
                  <span className="text-yellow-500">+{spinResult}</span>
                )}
                <span className="text-purple-600">tickets</span>
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          {!isSpinning && !spinResult && (
            <Button
              onClick={handleSpin}
              disabled={isSpinning || spinMutation.isPending || !dailyBonusId}
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
                  <RefreshCw className="mr-2 h-5 w-5" /> SPIN THE WHEEL!
                </>
              )}
            </Button>
          )}
          
          {spinResult && (
            <Button 
              onClick={onClose}
              className="flex-1 py-6 bg-green-500 hover:bg-green-600"
            >
              Awesome! Got it!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}