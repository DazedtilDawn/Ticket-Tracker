/**
 * Centralized Chore Data Manager
 * Replaces all React Query chores calls to prevent infinite loops
 */

interface Chore {
  id: number;
  name: string;
  description: string | null;
  base_tickets: number;
  tier: string | null;
  is_active: boolean;
  emoji?: string | null;
}

class ChoreDataManager {
  private chores: Chore[] = [];
  private lastFetch = 0;
  private isLoading = false;
  private subscribers = new Set<(chores: Chore[]) => void>();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  subscribe(callback: (chores: Chore[]) => void) {
    this.subscribers.add(callback);
    // Immediately provide current data
    callback(this.chores);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.chores));
  }

  async fetchChores(): Promise<Chore[]> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.chores.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.chores;
    }

    // Prevent concurrent fetches
    if (this.isLoading) {
      return this.chores;
    }

    this.isLoading = true;

    try {
      const response = await fetch('/api/chores', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.chores = data;
      this.lastFetch = now;
      this.notifySubscribers();
      
      return this.chores;
    } catch (error) {
      console.error('Failed to fetch chores:', error);
      // Return cached data on error
      return this.chores;
    } finally {
      this.isLoading = false;
    }
  }

  getChores(): Chore[] {
    return this.chores;
  }

  // Force refresh (use sparingly)
  async refresh(): Promise<Chore[]> {
    this.lastFetch = 0;
    return this.fetchChores();
  }
}

export const choreDataManager = new ChoreDataManager();

// Initialize with first fetch
choreDataManager.fetchChores();