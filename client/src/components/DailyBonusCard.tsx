import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpinWheel } from './SpinWheel';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import type { DailyBonusSimple } from '@shared/schema';
import confetti from 'canvas-confetti';
import { Gift, Sparkles } from 'lucide-react';

interface DailyBonusCardProps {
  userId?: number;
  onBonusSpun?: () => void; // Callback to refresh parent data
}

export function DailyBonusCard({ userId, onBonusSpun }: DailyBonusCardProps) {
  const [bonus, setBonus] = useState<DailyBonusSimple | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Determine target user ID
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) return;

    fetchDailyBonus();
  }, [targetUserId]);

  const fetchDailyBonus = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      const url = user?.role === 'parent' && userId 
        ? `/api/bonus/today?userId=${userId}`
        : '/api/bonus/today';
        
      const response = await apiRequest(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily bonus');
      }

      const data = await response.json();
      setBonus(data);
    } catch (error) {
      console.error('Error fetching daily bonus:', error);
      toast({
        title: 'Error',
        description: 'Failed to load daily bonus',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpinComplete = (tickets: number) => {
    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    });

    // Show success toast
    toast({
      title: '🎉 Bonus Earned!',
      description: `You won ${tickets} ticket${tickets > 1 ? 's' : ''}!`,
    });

    // Update local state to show revealed
    if (bonus) {
      setBonus({
        ...bonus,
        revealed: true,
        bonus_tickets: tickets,
      });
    }

    // Call parent callback to refresh balance/stats
    if (onBonusSpun) {
      onBonusSpun();
    }
  };

  if (loading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Daily Bonus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  if (!bonus) {
    return null;
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Daily Bonus
          {!bonus.revealed && (
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {bonus.revealed ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Bonus Collected!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You earned <span className="font-bold text-green-600 dark:text-green-400">{bonus.bonus_tickets} tickets</span> today
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Come back tomorrow for another spin!
            </p>
          </div>
        ) : (
          <SpinWheel bonus={bonus} onSpun={handleSpinComplete} />
        )}
      </CardContent>
    </Card>
  );
}