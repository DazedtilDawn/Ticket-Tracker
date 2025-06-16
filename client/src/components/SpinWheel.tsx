import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { DailyBonusSimple } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';

interface SpinWheelProps {
  bonus: DailyBonusSimple;
  onSpun: (tickets: number) => void;
}

const TICKET_VALUES = [1, 2, 3, 5, 8];
const SLICE_ANGLE = 360 / TICKET_VALUES.length; // 72 degrees per slice

export function SpinWheel({ bonus, onSpun }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();
  
  // Get auth state to check if parent is viewing as child
  const { originalUser, viewingChildId } = useAuthStore();
  const isParentViewingAsChild = !!originalUser && !!viewingChildId;

  const handleSpin = useCallback(async () => {
    if (isSpinning || bonus.revealed) return;

    setIsSpinning(true);

    try {
      // Call the spin API
      // If parent is viewing as child, send the child's userId
      const requestBody = isParentViewingAsChild && viewingChildId 
        ? { userId: viewingChildId }
        : {};
        
      const data = await apiRequest('/api/bonus/spin', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const { tickets_awarded: tickets } = data;

      // Calculate which slice to land on based on the tickets won
      const sliceIndex = TICKET_VALUES.indexOf(tickets);
      if (sliceIndex === -1) {
        throw new Error('Invalid ticket value received');
      }

      // Calculate final rotation: 5 full spins + landing on the correct slice
      // Add randomness to landing position within the slice
      const randomOffset = Math.random() * (SLICE_ANGLE * 0.8) - (SLICE_ANGLE * 0.4);
      const targetAngle = sliceIndex * SLICE_ANGLE + randomOffset;
      const finalRotation = rotation + (360 * 5) + (360 - targetAngle);

      setRotation(finalRotation);

      // Wait for animation to complete before calling onSpun
      setTimeout(() => {
        onSpun(tickets);
        setIsSpinning(false);
      }, 3000); // Match animation duration

    } catch (error) {
      console.error('Error spinning wheel:', error);
      toast({
        title: 'Spin Failed',
        description: error instanceof Error ? error.message : 'Unable to spin the wheel',
        variant: 'destructive',
      });
      setIsSpinning(false);
    }
  }, [bonus, isSpinning, rotation, onSpun, toast, isParentViewingAsChild, viewingChildId]);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          Daily Bonus Wheel
        </h3>
      </div>
      
      {/* Wheel Container */}
      <div className="relative w-72 h-72 hover:scale-[1.02] transition-transform duration-300">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-yellow-500 drop-shadow-lg"></div>
          </div>
        </div>

        {/* Spinning Wheel */}
        <motion.div
          className="w-full h-full rounded-full relative overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 ring-2 ring-gray-200 dark:ring-gray-600"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: "easeOut" }}
          style={{ transformOrigin: "center" }}
        >
          {/* SVG Wheel */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {TICKET_VALUES.map((value, index) => {
              const startAngle = index * SLICE_ANGLE;
              const endAngle = startAngle + SLICE_ANGLE;
              
              // Convert angles to radians
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              // Calculate path coordinates
              const largeArcFlag = SLICE_ANGLE > 180 ? 1 : 0;
              const x1 = 100 + 100 * Math.cos(startRad);
              const y1 = 100 + 100 * Math.sin(startRad);
              const x2 = 100 + 100 * Math.cos(endRad);
              const y2 = 100 + 100 * Math.sin(endRad);
              
              // Choose colors for each slice - more vibrant gradient
              const fillColors = [
                '#3b82f6', // blue-500
                '#10b981', // emerald-500
                '#f59e0b', // amber-500
                '#8b5cf6', // violet-500
                '#ef4444', // red-500
              ];

              return (
                <g key={index}>
                  {/* Slice */}
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={fillColors[index]}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-90 transition-opacity"
                  />
                  
                  {/* Text */}
                  <text
                    x={100 + 60 * Math.cos((startRad + endRad) / 2)}
                    y={100 + 60 * Math.sin((startRad + endRad) / 2)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-white font-bold text-2xl select-none"
                    style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}
                  >
                    {value}
                  </text>
                </g>
              );
            })}
            
            {/* Center circle with gradient */}
            <defs>
              <radialGradient id="centerGradient">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f3f4f6" />
              </radialGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="30"
              fill="url(#centerGradient)"
              stroke="#e5e7eb"
              strokeWidth="3"
              className="dark:stroke-gray-600"
            />
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-gray-700 dark:text-gray-300 font-bold text-sm select-none"
            >
              SPIN
            </text>
          </svg>
        </motion.div>

        {/* Spin Button Overlay */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || bonus.revealed}
          className={`
            absolute inset-0 flex items-center justify-center
            ${isSpinning || bonus.revealed ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label="Spin daily bonus wheel"
        >
          {!isSpinning && (
            <div
              className={`
                rounded-full shadow-xl border-2 transition-all duration-200
                ${bonus.revealed 
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 px-8 py-4' 
                  : 'bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 border-gray-300 dark:border-gray-600 px-6 py-3 hover:scale-110 hover:shadow-2xl'
                }
              `}
            >
              <span className={`font-bold text-lg ${bonus.revealed ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'}`}>
                {bonus.revealed ? '✓ Done' : 'CLICK TO SPIN'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Instructions */}
      {!bonus.revealed && !isSpinning && (
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 text-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
          🎆 Click the wheel to spin and reveal your daily bonus tickets!
        </p>
      )}
      
      {isSpinning && (
        <div className="mt-6 flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-lg">
          <div className="h-4 w-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Spinning the wheel...
          </p>
        </div>
      )}
      
      {bonus.revealed && (
        <div className="mt-6 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg border border-green-300 dark:border-green-700">
          <p className="text-sm font-medium text-green-700 dark:text-green-300 text-center">
            🎉 You already spun today! Come back tomorrow!
          </p>
        </div>
      )}
    </div>
  );
}