import { create } from "zustand";
import { apiRequest } from "@/lib/queryClient";

interface Chore {
  id: number;
  name: string;
  description: string;
  base_tickets: number;
  tier: string;
  is_active: boolean;
  completed?: boolean;
  boostPercent?: number;
}

interface ChoreState {
  chores: Chore[];
  isLoading: boolean;
  error: string | null;
  fetchChores: () => Promise<void>;
  completeChore: (choreId: number) => Promise<void>;
  createChore: (chore: Partial<Chore>) => Promise<void>;
  updateChore: (id: number, updates: Partial<Chore>) => Promise<void>;
  deleteChore: (id: number) => Promise<void>;
}

export const useChoreStore = create<ChoreState>((set, get) => ({
  chores: [],
  isLoading: false,
  error: null,

  fetchChores: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiRequest("/api/chores", { method: "GET" });
      set({ chores: data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },

  completeChore: async (choreId: number) => {
    set({ isLoading: true, error: null });

    try {
      await apiRequest("/api/earn", {
        method: "POST",
        body: JSON.stringify({ chore_id: choreId }),
        headers: { "Content-Type": "application/json" },
      });

      // Mark chore as completed
      const chores = get().chores.map((chore) =>
        chore.id === choreId ? { ...chore, completed: true } : chore,
      );

      set({ chores, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },

  createChore: async (chore: Partial<Chore>) => {
    set({ isLoading: true, error: null });

    try {
      const newChore = await apiRequest("/api/chores", {
        method: "POST",
        body: JSON.stringify(chore),
        headers: { "Content-Type": "application/json" },
      });

      set((state) => ({
        chores: [...state.chores, newChore],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },

  updateChore: async (id: number, updates: Partial<Chore>) => {
    set({ isLoading: true, error: null });

    try {
      const updatedChore = await apiRequest(`/api/chores/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" },
      });

      set((state) => ({
        chores: state.chores.map((chore) =>
          chore.id === id ? { ...chore, ...updatedChore } : chore,
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },

  deleteChore: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      await apiRequest(`/api/chores/${id}`, { method: "DELETE" });

      set((state) => ({
        chores: state.chores.filter((chore) => chore.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },
}));
