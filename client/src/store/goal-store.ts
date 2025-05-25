import { create } from "zustand";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: number;
  title: string;
  asin: string;
  image_url: string;
  price_cents: number;
  price_locked_cents: number;
  last_checked: string;
}

interface Goal {
  id: number;
  user_id: number;
  product_id: number;
  tickets_saved?: number; // Now calculated from balance
  is_active: boolean;
  product?: Product;
  progress?: number;
}

interface GoalState {
  goals: Goal[];
  activeGoal: Goal | null;
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  fetchActiveGoal: () => Promise<void>;
  createGoal: (goal: { user_id: number; product_id: number }) => Promise<void>;
  activateGoal: (goalId: number) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  activeGoal: null,
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiRequest("/api/goals", { method: "GET" });
      set({ goals: data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },

  fetchActiveGoal: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiRequest("/api/goals/active", { method: "GET" });
      set({ activeGoal: data, isLoading: false });
    } catch (error: any) {
      if (error?.status === 404) {
        // No active goal is not an error
        set({ activeGoal: null, isLoading: false });
      } else {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, isLoading: false });
      }
    }
  },

  createGoal: async (goal) => {
    set({ isLoading: true, error: null });

    try {
      const newGoal = await apiRequest("/api/goals", {
        method: "POST",
        body: JSON.stringify(goal),
        headers: { "Content-Type": "application/json" },
      });

      set((state) => ({
        goals: [...state.goals, newGoal],
        isLoading: false,
      }));

      // If this is an active goal, update activeGoal
      if (newGoal.is_active) {
        set({ activeGoal: newGoal });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },

  activateGoal: async (goalId) => {
    set({ isLoading: true, error: null });

    try {
      const updatedGoal = await apiRequest(`/api/goals/${goalId}/activate`, {
        method: "PUT",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      set((state) => ({
        goals: state.goals.map((goal) => {
          if (goal.id === goalId) {
            return { ...goal, is_active: true };
          } else if (goal.is_active) {
            return { ...goal, is_active: false };
          }
          return goal;
        }),
        activeGoal: updatedGoal,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, isLoading: false });
    }
  },
}));
