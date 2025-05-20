import { create } from 'zustand';

// Define the StatsState interface
interface StatsState {
  balance: number;
  updateBalance: (newBalance: number) => void;
}

// Create the store with an initial balance of 0
export const useStatsStore = create<StatsState>((set) => ({
  balance: 0,
  updateBalance: (newBalance: number) => set({ balance: newBalance }),
}));
