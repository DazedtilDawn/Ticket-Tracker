/**
 * Custom hook for chores data with proper isolation to prevent infinite loops
 * This replaces all direct useQuery calls to the chores endpoint
 */
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface Chore {
  id: number;
  name: string;
  description: string | null;
  base_tickets: number;
  tier: string | null;
  is_active: boolean;
  emoji?: string | null;
}

let cachedChores: Chore[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 300000; // 5 minutes

export function useChoresData() {
  const [chores, setChores] = useState<Chore[]>(cachedChores);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChores = async () => {
    const now = Date.now();
    
    // Use cached data if still fresh
    if (cachedChores.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      setChores(cachedChores);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/api/chores');
      cachedChores = data;
      lastFetchTime = now;
      setChores(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chores';
      setError(errorMessage);
      console.error('Failed to fetch chores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have cached data
    if (cachedChores.length === 0) {
      fetchChores();
    } else {
      setChores(cachedChores);
    }
  }, []);

  return {
    chores,
    isLoading,
    error,
    refetch: fetchChores
  };
}