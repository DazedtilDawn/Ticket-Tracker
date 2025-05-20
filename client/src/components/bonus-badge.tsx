import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Award, Star } from 'lucide-react';

interface BonusBadgeProps {
  variant?: 'default' | 'small';
  className?: string;
}

export function BonusBadge({ variant = 'default', className = '' }: BonusBadgeProps) {
  // Add a subtle pulsing animation effect
  const [isPulsing, setIsPulsing] = useState(true);
  
  useEffect(() => {
    // Create pulsing effect every 3 seconds
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (variant === 'small') {
    return (
      <div 
        className={`inline-flex items-center justify-center ${className}`}
        title="Daily Bonus Chore"
      >
        <div className={`relative ${isPulsing ? 'animate-pulse' : ''}`}>
          <Star 
            className="h-4 w-4 text-yellow-500 fill-yellow-500"
            strokeWidth={1.5}
          />
        </div>
      </div>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`
        bg-gradient-to-r from-amber-100 to-yellow-100 
        dark:from-amber-950/40 dark:to-yellow-950/40
        border border-amber-200 dark:border-amber-800
        text-amber-800 dark:text-amber-300
        ${isPulsing ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <Award className="h-3.5 w-3.5 mr-1 text-yellow-500" />
      <span>Bonus</span>
    </Badge>
  );
}
