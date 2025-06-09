import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  apiRequest,
  getCachedQueryFn,
  apiCacheConfigs,
} from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { TICKET_DOLLAR_VALUE } from "../../../config/business";
import { useStatsStore } from "@/store/stats-store";
import {
  createWebSocketConnection,
  subscribeToChannel,
  sendMessage,
} from "@/lib/websocketClient";
import { useMobile } from "@/context/MobileContext";
import ProgressCard from "@/components/progress-card";
import SwipeableChoreCard from "@/components/swipeable-chore-card";
import TransactionsMobile from "@/components/transactions-mobile";
import TransactionsTableDesktop from "@/components/transactions-table-desktop";
import ChildDashboardHeader from "@/components/child-dashboard-header";
import MobileSectionTabs from "@/components/mobile-section-tabs";
import { NewChoreDialog } from "@/components/new-chore-dialog";
import { BadBehaviorDialog } from "@/components/bad-behavior-dialog";
import { GoodBehaviorDialog } from "@/components/good-behavior-dialog";
import { DailyBonusWheel } from "@/components/daily-bonus-wheel";
import { SpinPromptModal } from "@/components/spin-prompt-modal";
import { ChildBonusWheel } from "@/components/child-bonus-wheel";
import { PurchaseDialog } from "@/components/purchase-dialog";
import DashboardBanner from "@/components/dashboard-banner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusIcon,
  UserIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  ShoppingCartIcon,
  BarChart3Icon,
  Ticket,
  Trophy,
} from "lucide-react";
import { AchievementShowcase } from "@/components/achievement-showcase-new";
import { ParentControlPanel } from "@/components/ParentControlPanel";
import { format } from "date-fns";

export default function Dashboard() {
  const {
    user,
    isViewingAsChild,
    originalUser,
    setFamilyUsers,
    switchChildView,
    resetChildView,
    getChildUsers,
  } = useAuthStore();
  const { balance, updateBalance } = useStatsStore();
  const { toast } = useToast();
  const { isMobile } = useMobile();
  const viewingChild = isViewingAsChild();
  const queryClient = useQueryClient();
  const childUsers = getChildUsers();
  const isParentView = user?.role === "parent" && !viewingChild;

  // State for bonus spin prompt and wheel
  const [isSpinPromptOpen, setIsSpinPromptOpen] = useState(false);
  const [isBonusWheelModalOpen, setIsBonusWheelModalOpen] = useState(false);
  const [dailyBonusId, setDailyBonusId] = useState<number | null>(null);
  const [completedChoreName, setCompletedChoreName] = useState("");
  const [bonusTriggerType, setBonusTriggerType] = useState<
    "chore_completion" | "good_behavior_reward" | "respin" | null
  >(null);

  // State for child summary data
  const [childSummaries, setChildSummaries] = useState<
    { id: number; name: string; balance: number }[]
  >([]);

  // State to track last received WebSocket events for debugging
  const [lastWsEvents, setLastWsEvents] = useState<string[]>([]);

  // Load family users for the behavior dialogs and child summaries
  useEffect(() => {
    // Always fetch family users on dashboard load to ensure they're available for the behavior dialogs
    const loadFamilyUsers = async () => {
      try {
        console.log("Attempting to load family users...");
        // Use the apiRequest helper to ensure proper token handling
        const users = await apiRequest("/api/users", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        // Store all users in the auth store so they're available for the behavior dialogs
        if (users && Array.isArray(users)) {
          setFamilyUsers(users);
          console.log("Successfully loaded family users:", users);

          // Load balance data for each child user
          if (user?.role === "parent") {
            const children = users.filter((u) => u.role === "child");
            const summaries = await Promise.all(
              children.map(async (child) => {
                try {
                  const stats = await apiRequest(
                    `/api/stats?user_id=${child.id}`,
                    { method: "GET" },
                  );
                  return {
                    id: child.id,
                    name: child.name,
                    balance: stats?.balance || 0,
                  };
                } catch (err) {
                  console.error(
                    `Failed to load stats for child ${child.name}:`,
                    err,
                  );
                  return {
                    id: child.id,
                    name: child.name,
                    balance: 0,
                  };
                }
              }),
            );
            setChildSummaries(summaries);
          }
        } else {
          console.error("Unexpected response format for family users:", users);
        }
      } catch (err) {
        console.error("Failed to load family users:", err);
        toast({
          title: "Error loading users",
          description:
            "Could not load family members. Some features may not work correctly.",
          variant: "destructive",
        });
      }
    };

    // Load users immediately on component mount
    loadFamilyUsers();
  }, [setFamilyUsers, toast, user?.role]);

  /** ----------------------------------------------------------------
   *  Check for an un-spun daily bonus whenever a child dashboard
   *  mounts, the viewed child changes, or every 30 s while open.
   *  ----------------------------------------------------------------*/

  const activeChildId = useAuthStore((s) => s.getActiveChildId());

  // Use sessionStorage to track which children we've already checked for CHORE bonuses
  // But always check for good behavior bonuses since they can be awarded at any time
  useEffect(() => {
    if (!activeChildId) return; // store not hydrated yet

    const checkForUnspunBonus = async () => {
      try {
        console.log(
          "[Bonus] checking for unspun bonus for id:",
          activeChildId,
        );

        // Clear any old session storage entries for this child (over 2 minutes old)
        // This ensures recently awarded bonuses show up immediately
        const now = Date.now();
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith(`bonus_shown_${activeChildId}_`)) {
            const timestamp = sessionStorage.getItem(key);
            if (timestamp && (now - parseInt(timestamp)) > 120000) { // 2 minutes
              sessionStorage.removeItem(key);
              console.log(`[Bonus] Cleared session storage entry: ${key}`);
            }
          }
        });

        const response = await apiRequest(
          `/api/daily-bonus/unspun?user_id=${activeChildId}`,
          { method: "GET" },
        );

        // If we found an unspun daily bonus, open the spin prompt
        if (response && response.daily_bonus_id) {
          console.log("Found unspun bonus:", response);
          
          // Only prevent repeated prompts for the same bonus within a short timeframe
          const now = Date.now();
          const storageKey = `bonus_shown_${activeChildId}_${response.daily_bonus_id}`;
          const lastShown = sessionStorage.getItem(storageKey);
          
          // Only skip if the same bonus was shown within the last 30 seconds for good behavior bonuses
          // This ensures awarded bonuses appear immediately when parents visit child profiles
          const skipTimeMs = response.trigger_type === "good_behavior_reward" ? 30000 : 120000;
          if (!lastShown || (now - parseInt(lastShown)) > skipTimeMs) {
            // Don't mark as shown until AFTER the modal is opened successfully
            setDailyBonusId(response.daily_bonus_id);
            setCompletedChoreName(response.chore_name || "Daily Bonus");
            setBonusTriggerType(response.trigger_type || "good_behavior_reward");
            setIsSpinPromptOpen(true);
            
            // Only mark as shown after successfully opening the modal
            sessionStorage.setItem(storageKey, now.toString());
          } else {
            console.log(
              `[Optimization] Skipping bonus prompt for child ${activeChildId} - shown recently for bonus ${response.daily_bonus_id}`,
            );
          }
        } else {
          console.log("No unspun bonus found for this user");
        }
      } catch (error: any) {
        // Only log the error, don't show toast to avoid spamming the user
        const errorMessage = error?.message || "Unknown error";
        const errorStatus = error?.status || 500;

        // Don't log expected 404 responses - these happen when:
        // 1. There's no bonus assigned for today
        // 2. The bonus has already been spun
        // 3. The assigned bonus chore hasn't been completed yet
        if (errorStatus !== 404) {
          // Only log truly unexpected errors (server errors, etc.)
          console.error("Unexpected error checking for unspun bonus:", {
            status: errorStatus,
            message: errorMessage,
          });
        }
      }
    };

    // Add debounce to prevent excessive API calls
    const timeoutId = setTimeout(() => {
      // Only check once per minute per child to prevent performance issues
      const lastCheckKey = `last_bonus_check_${activeChildId}`;
      const lastCheck = sessionStorage.getItem(lastCheckKey);
      const now = Date.now();
      
      if (lastCheck && (now - parseInt(lastCheck)) < 60000) {
        console.log(`[Performance] Skipping bonus check - checked recently for child ${activeChildId}`);
        return;
      }
      
      // Mark this check time immediately to prevent race conditions
      sessionStorage.setItem(lastCheckKey, now.toString());
      checkForUnspunBonus();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeChildId]); // ← re-run when child changes or store hydrates

  // Fetch user stats, chores, and transactions
  // If viewing as child, the queryClient will automatically append userId parameter
  // Define better types for the API response
  interface StatsResponse {
    balance: number;
    activeGoal?: {
      id: number;
      user_id: number;
      product_id: number;
      tickets_saved: number;
      is_active: boolean;
      product: {
        id: number;
        title: string;
        asin: string;
        image_url: string;
        price_cents: number;
        price_locked_cents?: number; // Legacy field, now using price_cents
      };
      progress: number;
      overSavedTickets?: number;
      estimatedCompletion?: { days: number; weeks: number };
    };
    chores?: any[];
  }

  // Using enhanced caching for stats data with local storage fallback
  const { data, isLoading, error, refetch } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
    refetchInterval: 180000, // 3 minutes - reduced frequency
    staleTime: 90000, // 1.5 minutes - longer stale time
    gcTime: 300000, // 5 minutes cache retention
    queryFn: async ({ queryKey }) => {
      // Cache key based on query and current user/child view
      const authStore = JSON.parse(
        localStorage.getItem("ticket-tracker-auth") || "{}",
      );
      const viewingChildId = authStore?.state?.viewingChildId || "";
      const cacheKey = `stats_${viewingChildId}`;

      // Check session storage for a recent cache hit
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTime = sessionStorage.getItem(`${cacheKey}_time`);

        if (cachedData && cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age < 30000) {
            // 30 seconds
            console.log(`[CACHE HIT] Using cached stats, age: ${age}ms`);
            return JSON.parse(cachedData);
          }
        }

        // Cache miss or stale, make the API call
        console.log(`[CACHE MISS] Fetching fresh stats data`);

        // Build proper URL with child ID if needed
        let url = queryKey[0] as string;
        if (viewingChildId) {
          url = `${url}?userId=${viewingChildId}`;
        }

        const token = authStore?.state?.token;
        const response = await fetch(url, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Cache the fresh data
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

        return data;
      } catch (error) {
        console.error("Error fetching stats:", error);
        throw error;
      }
    },
  });

  // Update stats store whenever data changes
  useEffect(() => {
    if (data) {
      console.log("Loaded dashboard stats:", data);
      // Initialize the global balance state from the API
      updateBalance(data.balance);
    }
  }, [data, updateBalance]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Refetch data when user changes (switching between parent and child views)
  useEffect(() => {
    refetch();
  }, [user?.id, refetch]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    console.log("Setting up WebSocket listeners for transaction events");

    // Ensure we have an active WebSocket connection
    createWebSocketConnection();

    // Special catch-all handler for debug display
    const debugSubscription = subscribeToChannel("", (data) => {
      const timestamp = new Date().toLocaleTimeString();
      const eventInfo = `${timestamp} - ${data.event}`;
      setLastWsEvents((prev) => [eventInfo, ...prev.slice(0, 4)]);
    });

    // Global handler for ALL transaction events to ensure nothing is missed
    const generalTransactionSubscription = subscribeToChannel(
      "transaction:",
      (data) => {
        console.log("Received any transaction event - general handler:", data);

        // Extract the user ID from the transaction data
        const transactionUserId = data.data?.user_id;

        // Add the transaction event to our debug panel with more details
        const timestamp = new Date().toLocaleTimeString();
        const txType = data.event.split(":")[1] || "unknown";
        // Handle both old and new field names for compatibility
        const txAmount =
          data.data?.delta_tickets !== undefined
            ? data.data.delta_tickets
            : data.data?.amount !== undefined
              ? data.data.amount
              : "?";
        const eventDetails = `${timestamp} - 💰 ${txType} ${txAmount} tickets`;
        setLastWsEvents((prev) => [eventDetails, ...prev.slice(0, 4)]);

        console.log(
          `General transaction handler - Current user ID: ${user?.id}, transaction for user ID: ${transactionUserId}`,
        );

        // Only show toast and update UI if this transaction is for the current user
        if (transactionUserId === user?.id) {
          console.log(
            "Transaction is for current user, showing toast and updating UI",
          );

          // Show a toast notification for the transaction
          toast({
            title: `Transaction: ${txType}`,
            description: `${txAmount} tickets - ${data.data?.note || data.data?.description || ""}`,
            variant: txAmount > 0 ? "default" : "destructive",
          });

          // Check if the server sent a new balance for immediate UI update
          if (data.data?.balance !== undefined) {
            console.log(
              `Updating balance directly in the cache: ${data.data.balance}`,
            );
            // Update the balance directly in the cache
            queryClient.setQueryData(["/api/stats"], (oldData: any) => {
              return {
                ...oldData,
                balance: data.data.balance,
              };
            });
            
            // Also update the stats store for immediate UI update
            updateBalance(data.data.balance);
          }

          // Immediately invalidate all relevant queries to ensure UI updates
          console.log(
            "Invalidating and refreshing ALL transaction and stats queries",
          );
          queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

          // Force immediate refetches of ALL related queries with a small delay to ensure backend has processed changes
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/stats"] });
            queryClient.refetchQueries({
              queryKey: ["/api/transactions"],
              exact: false,
            });

            // Specifically refresh the dashboard stats
            refetch();
          }, 100);
        } else {
          console.log(
            "Transaction is for a different user, not updating current user's UI",
          );
        }
      },
    );

    // Specific handlers for different transaction types (for UI notifications)
    const earningSubscription = subscribeToChannel(
      "transaction:earn",
      (data) => {
        console.log("Received transaction:earn event:", data);
        // Handle both formats: data.transaction or data.data
        const tickets =
          data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
        const userId = data.data?.user_id || data.transaction?.user_id;
        const balance = data.data?.balance;
        const note = data.data?.note || data.transaction?.note || "";

        console.log(
          `Current user ID: ${user?.id}, transaction for user ID: ${userId}`,
        );
        console.log(`Transaction data:`, { tickets, userId, balance, note });

        // Only update UI and show notifications if this transaction is for the current user
        if (userId === user?.id) {
          console.log(
            "Transaction is for current user, updating UI with new balance:",
            balance,
          );

          // If server sent the new balance, update it directly in the UI for immediate feedback
          if (balance !== undefined) {
            console.log(
              "Applying direct balance update to cache and stats store:",
              balance,
            );

            // Update the centralized stats store for immediate UI updates across all components
            updateBalance(balance);

            // Also update the query cache to keep everything in sync
            queryClient.setQueryData(["/api/stats"], (oldData: any) => {
              if (!oldData) return oldData;
              console.log("Updating stats cache with new balance", {
                oldBalance: oldData.balance,
                newBalance: balance,
              });
              return {
                ...oldData,
                balance: balance,
              };
            });
          }

          // Show a toast notification about the transaction
          toast({
            title: "Tickets Earned",
            description: `${tickets} tickets earned - ${note}`,
          });

          // Force immediate query invalidation and refreshes for this specific event
          console.log(
            "Transaction:earn event - forcing complete data refresh cycle",
          );
          queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

          // Small delay to ensure backend has processed all changes
          setTimeout(() => {
            // Force immediate refetch of all transaction-related queries
            queryClient.refetchQueries({
              queryKey: ["/api/transactions"],
              exact: false,
            });
            queryClient.refetchQueries({ queryKey: ["/api/stats"] });
          }, 100);
        } else {
          console.log(
            "Transaction is for a different user, not updating current user's balance",
          );
        }
      },
    );

    const spendingSubscription = subscribeToChannel(
      "transaction:spend",
      (data) => {
        console.log("Received transaction:spend event:", data);
        // Handle both formats: data.transaction or data.data
        const tickets =
          data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
        const userId = data.data?.user_id || data.transaction?.user_id;

        console.log(
          `Current user ID: ${user?.id}, transaction for user ID: ${userId}`,
        );

        // Only update UI if this transaction is for the current user
        if (userId === user?.id) {
          console.log(
            "Transaction is for current user, updating UI with new balance",
          );

          // If server sent the new balance, update it directly in the UI
          if (data.data?.balance !== undefined) {
            console.log(
              "Updating stats cache with new balance:",
              data.data.balance,
            );
            queryClient.setQueryData(["/api/stats"], (oldData: any) => {
              return {
                ...oldData,
                balance: data.data.balance,
              };
            });
          }

          // Show toast notification for the user
          toast({
            title: "Tickets Spent",
            description: `${Math.abs(tickets)} tickets spent`,
          });
        } else {
          console.log(
            "Transaction is for a different user, not updating current user's balance",
          );
        }

        // Whether it's for this user or not, we should refresh all transaction data
        // to ensure the transactions table is up-to-date for parents viewing child accounts
        console.log(
          "Transaction:spend event - forcing complete data refresh cycle",
        );
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

        // Add a small delay to ensure backend has processed all changes
        setTimeout(() => {
          // Force immediate refetch of all transaction-related queries
          console.log("Executing delayed refetch for transaction:spend event");
          queryClient.refetchQueries({
            queryKey: ["/api/transactions"],
            exact: false,
          });
          queryClient.refetchQueries({ queryKey: ["/api/stats"] });
        }, 100);
      },
    );

    const deductionSubscription = subscribeToChannel(
      "transaction:deduct",
      (data) => {
        console.log("Received transaction:deduct event:", data);
        // Handle both formats: data.transaction or data.data
        const tickets =
          data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
        const userId = data.data?.user_id || data.transaction?.user_id;

        console.log(
          `Current user ID: ${user?.id}, transaction for user ID: ${userId}`,
        );

        // Only update UI if this transaction is for the current user
        if (userId === user?.id) {
          console.log(
            "Transaction is for current user, updating UI with new balance",
          );

          // If server sent the new balance, update it directly in the UI
          if (data.data?.balance !== undefined) {
            queryClient.setQueryData(["/api/stats"], (oldData: any) => {
              return {
                ...oldData,
                balance: data.data.balance,
              };
            });
          }
        } else {
          console.log(
            "Transaction is for a different user, not updating current user's balance",
          );
        }

        toast({
          title: "Tickets Deducted",
          description: `${Math.abs(tickets)} tickets deducted`,
        });
        // Force immediate query invalidation for this specific event
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      },
    );

    const rewardSubscription = subscribeToChannel(
      "transaction:reward",
      (data) => {
        console.log("Received transaction:reward event:", data);
        // Handle both formats: data.data or data.transaction
        const tickets =
          data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
        const userId = data.data?.user_id || data.transaction?.user_id;

        console.log(
          `Current user ID: ${user?.id}, transaction for user ID: ${userId}`,
        );

        // Only update UI if this transaction is for the current user
        if (userId === user?.id) {
          console.log(
            "Transaction is for current user, updating UI with new balance",
          );

          // If server sent the new balance, update it directly in the UI
          if (data.data?.balance !== undefined) {
            queryClient.setQueryData(["/api/stats"], (oldData: any) => {
              return {
                ...oldData,
                balance: data.data.balance,
              };
            });
          }
        } else {
          console.log(
            "Transaction is for a different user, not updating current user's balance",
          );
        }

        toast({
          title: "Bonus Tickets",
          description: `${tickets} bonus tickets awarded`,
        });
        // Force immediate query invalidation for this specific event
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      },
    );

    // Handler for transaction:delete events to update the goal progress meter
    const deleteSubscription = subscribeToChannel(
      "transaction:delete",
      (data) => {
        console.log("Received transaction:delete event:", data);

        // Extract the user ID and updated balance - could be in data.data or directly in data
        const userId = data.data?.user_id || data.user_id;
        const balance = data.data?.balance || data.balance;
        const goal = data.data?.goal || data.goal;

        console.log(
          `Transaction delete - Current user ID: ${user?.id}, affected user ID: ${userId}`,
        );

        // Only update UI if this transaction is for the current user or the child we're viewing
        if (userId === user?.id) {
          console.log(
            "Transaction delete is for current user, updating UI with new balance and goal data",
          );

          // Update balance in the stats store for immediate UI updates
          if (balance !== undefined) {
            updateBalance(balance);
          }

          // Update the query cache with the new balance and goal data
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            if (!oldData) return oldData;

            // Create new data object with updated balance
            const newData = {
              ...oldData,
              balance: balance,
            };

            // If we have updated goal data, update that too to refresh the progress meter
            if (goal) {
              newData.activeGoal = goal;
              console.log("Updating goal data in stats cache:", goal);
            }

            return newData;
          });

          // Show toast notification
          toast({
            title: "Transaction Removed",
            description: "Transaction deleted and balances updated",
          });
        }

        // Force immediate query invalidation to ensure all UI components are updated
        console.log(
          "Transaction:delete event - forcing complete data refresh cycle",
        );
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

        // Add a small delay to ensure backend processing is complete
        setTimeout(() => {
          console.log("Executing delayed refetch for transaction:delete event");
          // Force immediate refetch of ALL transaction-related queries with exact=false to catch any with parameters
          queryClient.refetchQueries({
            queryKey: ["/api/transactions"],
            exact: false,
          });
          queryClient.refetchQueries({ queryKey: ["/api/stats"] });

          // Force a refetch of the dashboard stats specifically
          refetch();
        }, 100);
      },
    );

    // Handler for bonus spin completion
    const bonusSpinSubscription = subscribeToChannel(
      "bonus:spin",
      (data) => {
        console.log("Received bonus:spin event:", data);
        
        const userId = data.user_id;
        const tickets = data.tickets;
        const newBalance = data.balance;
        
        // Get the current user from the auth store
        const authStore = useAuthStore.getState();
        const currentUser = authStore.user;
        
        // Only update if this spin is for the current user
        if (userId === currentUser?.id && newBalance !== undefined) {
          console.log("Bonus spin completed, updating balance to:", newBalance);
          
          // Immediately update the balance in the cache
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              balance: newBalance,
            };
          });
          
          // Update the balance in the stats store as well
          updateBalance(newBalance);
        }
      },
    );

    // Handler for good behavior bonus spin awards
    const goodBehaviorBonusSubscription = subscribeToChannel(
      "daily_bonus:good_behavior",
      (data) => {
        console.log("Received daily_bonus:good_behavior event:", data);
        
        const userId = data.user_id;
        const dailyBonus = data.daily_bonus;
        
        // Get the current user from the auth store to avoid stale closures
        const authStore = useAuthStore.getState();
        const currentUser = authStore.user;
        
        console.log(
          `Good behavior bonus - Current user ID: ${currentUser?.id}, bonus for user ID: ${userId}`,
        );
        
        // Only show the spin prompt if this bonus is for the current user
        if (userId === currentUser?.id && dailyBonus) {
          console.log(
            "Good behavior bonus is for current user, showing spin prompt",
          );
          
          // Set the bonus details and show the spin prompt
          setDailyBonusId(dailyBonus.id);
          setBonusTriggerType("good_behavior_reward");
          setCompletedChoreName("Good Behavior Reward");
          setIsSpinPromptOpen(true);
          
          // Also invalidate the unspun bonus query to ensure it gets refetched
          queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus/unspun"] });
          
          // Clear sessionStorage for good behavior checks to ensure the modal shows
          const today = new Date().toISOString().split("T")[0];
          const storageKey = `chore_bonus_check_${userId}_${today}`;
          sessionStorage.removeItem(storageKey);
          
          // Show a toast notification
          toast({
            title: "🎉 Bonus Spin Awarded!",
            description: "You've been awarded a bonus spin for good behavior!",
          });
        } else {
          console.log(
            "Good behavior bonus is for a different user, not showing prompt",
          );
        }
      },
    );

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      debugSubscription(); // Unsubscribe from the debug handler
      generalTransactionSubscription(); // Unsubscribe from the general handler
      earningSubscription();
      spendingSubscription();
      deductionSubscription();
      rewardSubscription();
      deleteSubscription(); // Unsubscribe from delete events
      bonusSpinSubscription(); // Unsubscribe from bonus spin events
      goodBehaviorBonusSubscription(); // Unsubscribe from good behavior bonus events
      console.log("Dashboard WebSocket subscriptions cleaned up");
    };
  }, [queryClient, toast, user?.id]);

  // Handle earn transaction completion (from child components)
  const handleChoreComplete = async (choreId: number) => {
    try {
      navigator.vibrate?.(24);
    } catch {}
    try {
      // If we're viewing as a child, include the userId in the request
      const payload: any = { chore_id: choreId };

      // If a parent is viewing a child account, include the child's user ID
      if (viewingChild && user) {
        payload.user_id = user.id;
        console.log("Adding user_id to chore completion payload:", user.id);
      }

      // Make the API request to complete the chore
      console.log("Submitting chore completion with payload:", payload);
      const response = await apiRequest("/api/earn", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("Chore completion response:", response);

      // If the response includes the new balance, update our stats store immediately
      if (response && response.balance !== undefined) {
        console.log(
          "Updating balance from chore completion:",
          response.balance,
        );
        updateBalance(response.balance);
      }

      // Check if this chore completion triggered a bonus
      if (
        response &&
        response.bonus_triggered === true &&
        response.daily_bonus_id
      ) {
        console.log(
          "Bonus chore triggered! Opening spin modal with bonus ID:",
          response.daily_bonus_id,
        );
        // Pass the chore info to the bonus handler to open the spin modal
        handleBonusChoreComplete(
          response.daily_bonus_id,
          response.chore ? response.chore.name : "Daily Bonus Chore",
        );
      }

      toast({
        title: "Chore Completed!",
        description: viewingChild
          ? `${user?.name} has earned tickets for completing this chore.`
          : "You've earned tickets for completing this chore.",
      });

      // Still refetch to update other parts of the UI
      refetch();

      // Return the response with the transaction ID for the undo functionality
      return {
        transaction: response.transaction,
        transaction_id: response.transaction?.id || response.transaction_id,
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete chore",
        variant: "destructive",
      });
    }
  };

  // Handle bonus chore completion - shows the spin wheel modal
  const handleBonusChoreComplete = (bonusId: number, choreName: string) => {
    console.log(`Bonus chore completed: ${choreName} (ID: ${bonusId})`);
    setDailyBonusId(bonusId);
    setCompletedChoreName(choreName);
    setIsSpinPromptOpen(true);
  };

  // Handle user clicking "Spin Now!" in the prompt modal
  const handleUserInitiatesSpin = (bonusIdFromPrompt: number) => {
    console.log(`User initiated spin for daily_bonus_id: ${bonusIdFromPrompt}`);
    // Close the prompt modal
    setIsSpinPromptOpen(false);
    // Open the main wheel modal
    setIsBonusWheelModalOpen(true);
  };

  // Handle actual wheel spin action (called from the wheel component)
  const handleSpinWheel = async (bonusId: number) => {
    try {
      console.log(`Spinning wheel for daily bonus ID: ${bonusId}`);
      const response = await apiRequest("/api/bonus/spin", {
        method: "POST",
        body: JSON.stringify({}), // Server looks up today's bonus automatically
      });

      console.log("Bonus spin response:", response);

      // The server will send a WebSocket event with the spin results
      // which will trigger a UI update automatically
      toast({
        title: "Bonus Spin!",
        description: "Spinning the wheel to determine your bonus reward...",
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });

      return {
        segmentIndex: response.segment_index,
        ticketsAwarded: response.tickets_awarded,
        segmentLabel: response.segment_label,
        respinAllowed: response.respin_allowed,
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to spin the bonus wheel",
        variant: "destructive",
      });
      return null;
    }
  };

  // Handle closing the wheel modal
  const handleWheelComplete = () => {
    setIsBonusWheelModalOpen(false);
  };

  return (
    <>
      {/* Bonus Spin Prompt Modal */}
      <SpinPromptModal
        isOpen={isSpinPromptOpen}
        onClose={() => setIsSpinPromptOpen(false)}
        onSpin={handleUserInitiatesSpin}
        choreName={completedChoreName}
        childName={user?.name || ""}
        dailyBonusId={dailyBonusId || 0}
      />

      {/* Child Bonus Wheel Modal - shown after SpinPromptModal */}
      <ChildBonusWheel
        isOpen={isBonusWheelModalOpen}
        onClose={handleWheelComplete}
        dailyBonusId={dailyBonusId}
        childName={user?.name || ""}
        triggerType={bonusTriggerType || undefined}
      />

      {/* Main Dashboard Content */}
      {viewingChild ? (
        <DashboardBanner
          defaultBannerColor={
            user?.name === "Kiki"
              ? "bg-gradient-to-r from-pink-500/30 via-purple-400/20 to-indigo-300/30"
              : user?.name === "Bryce"
                ? "bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-teal-300/30"
                : "bg-gradient-to-r from-primary-500/30 via-primary-400/20 to-primary-300/30"
          }
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {user?.role === "parent" && !viewingChild && (
                <NewChoreDialog onChoreCreated={refetch}>
                  <Button className="inline-flex items-center">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New Chore
                  </Button>
                </NewChoreDialog>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {!isParentView && (
          <>
            <ChildDashboardHeader activeGoal={data?.activeGoal} />
            <MobileSectionTabs />
          </>
        )}

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Progress Summary */}
            <section className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Savings Progress
                    </h3>
                    <div className="flex items-center gap-4">
                      {/* Purchase Button - Only show for child or when viewing as child */}
                      {/* Spend Tickets button moved to header */}
                    </div>
                  </div>

                  {data?.activeGoal ? (
                    <ProgressCard goal={data.activeGoal} onRefresh={refetch} />
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No active goal set. Visit the wishlist page to add a
                        goal.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Chores Section */}
            <section id="chores" className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Today's Chores
                </h3>
                <div className="flex items-center space-x-2">
                  {!viewingChild && user?.role === "parent" && (
                    <>
                      <BadBehaviorDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                        >
                          <MinusCircleIcon className="w-4 h-4 mr-1" /> Bad
                          Behavior
                        </Button>
                      </BadBehaviorDialog>
                      <GoodBehaviorDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950 dark:hover:text-green-300"
                        >
                          <PlusCircleIcon className="w-4 h-4 mr-1" /> Good
                          Behavior
                        </Button>
                      </GoodBehaviorDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-900 dark:hover:bg-indigo-950"
                        onClick={() => (window.location.href = "/catalog")}
                      >
                        <ShoppingCartIcon className="w-4 h-4 mr-1" /> Purchase
                      </Button>
                    </>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Filter by:
                  </span>
                  <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 pl-3 pr-8">
                    <option>All</option>
                    <option>Completed</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.chores && data.chores.length > 0 ? (
                  data.chores.map((chore) => (
                    <SwipeableChoreCard
                      key={chore.id}
                      chore={chore}
                      onComplete={handleChoreComplete}
                      onBonusComplete={handleBonusChoreComplete}
                    />
                  ))
                ) : (
                  <div className="col-span-3 p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No chores available.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Daily Bonus Wheel - Only visible to parents */}
            {!viewingChild && user?.role === "parent" && (
              <section className="mb-8">
                <DailyBonusWheel />
              </section>
            )}

            {/* Recent Transactions */}
            <section id="activity">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Transactions
                </h3>
                <a
                  href="/transactions"
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View All
                </a>
              </div>

              {/* Only render one transaction component based on viewport size to avoid duplicate API calls */}
              {isMobile ? (
                <TransactionsMobile limit={5} />
              ) : (
                <TransactionsTableDesktop limit={5} />
              )}
            </section>

            {/* Trophy Showcase Section */}
            <section id="trophies" className="mt-8 mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-amber-500" />
                  Trophy Showcase
                </h3>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Your personal collection of rewards and achievements
                  </span>
                </div>
              </div>

              {/* Display the achievement showcase with the current user's ID */}
              <AchievementShowcase userId={user?.id} />
            </section>

            {/* WebSocket Debug Panel - visible only in development */}
            {import.meta.env.DEV && (
              <section className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${lastWsEvents.length > 0 ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                    WebSocket Debug Monitor
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Add timestamp to message to track round-trip time
                      const timestamp = new Date().toISOString();
                      const success = sendMessage("client:ping", { timestamp });

                      // Record the test attempt in our event log
                      const attemptMsg = `${new Date().toLocaleTimeString()} - Test ping sent (${success ? "OK" : "FAILED"})`;
                      setLastWsEvents((prev) => [
                        attemptMsg,
                        ...prev.slice(0, 4),
                      ]);

                      toast({
                        title: success ? "Ping sent" : "Ping failed",
                        description: success
                          ? "Testing WebSocket connection... Check for response."
                          : "Could not send ping. Connection may be closed.",
                        variant: success ? "default" : "destructive",
                      });
                    }}
                  >
                    Test Connection
                  </Button>
                </div>
                {lastWsEvents.length > 0 ? (
                  <div className="text-sm font-mono">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Last 5 events received:
                    </p>
                    <ul className="space-y-1">
                      {lastWsEvents.map((event, i) => (
                        <li
                          key={i}
                          className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                        >
                          {event}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No WebSocket events received yet. Try refreshing or
                    performing an action.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* Parent Control Panel - shows when parent is viewing as child */}
      <ParentControlPanel />
    </>
  );
}
