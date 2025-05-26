import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
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
import { NewChoreDialog } from "@/components/new-chore-dialog";
import { BadBehaviorDialog } from "@/components/bad-behavior-dialog";
import { GoodBehaviorDialog } from "@/components/good-behavior-dialog";
import { DailyBonusWheel } from "@/components/daily-bonus-wheel";
import { SpinPromptModal } from "@/components/spin-prompt-modal";
import { ChildBonusWheel } from "@/components/child-bonus-wheel";
import { PurchaseDialog } from "@/components/purchase-dialog";
import { DailyBonusCard } from "@/components/DailyBonusCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusIcon,
  UserIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  ShoppingCartIcon,
  BarChart3Icon,
} from "lucide-react";
import MobileSectionTabs from "@/components/mobile-section-tabs";
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
  const { isMobile } = useMobile();
  const { toast } = useToast();
  const viewingChild = isViewingAsChild();
  const queryClient = useQueryClient();
  const childUsers = getChildUsers();

  // State for bonus spin prompt and wheel
  const [isSpinPromptOpen, setIsSpinPromptOpen] = useState(false);
  const [isBonusWheelModalOpen, setIsBonusWheelModalOpen] = useState(false);
  const [dailyBonusId, setDailyBonusId] = useState<number | null>(null);
  const [completedChoreName, setCompletedChoreName] = useState("");

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

  const activeChildId = useAuthStore((s) => s.getActiveChildId()); // ← resolve once

  // UseRef to track if we've already checked for a bonus
  const hasCheckedBonus = useRef(false);

  useEffect(() => {
    if (!activeChildId) return; // store not hydrated yet
    if (hasCheckedBonus.current) return; // Only check once per session

    // Mark as checked
    hasCheckedBonus.current = true;

    const checkForUnspunBonus = async () => {
      try {
        console.log(
          "[Bonus] checking for unspun bonus once for id:",
          activeChildId,
        );

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
          
          // Only skip if the same bonus was shown within the last 5 minutes
          if (!lastShown || (now - parseInt(lastShown)) > 300000) {
            sessionStorage.setItem(storageKey, now.toString());
            setDailyBonusId(response.daily_bonus_id);
            setCompletedChoreName(response.chore_name || "Daily Bonus");
            setIsSpinPromptOpen(true);
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

    // Just check once on load - no more constant polling
    checkForUnspunBonus();

    // We'll rely on WebSocket events for real-time updates instead of polling
  }, [activeChildId]); // ← re-run when child changes or store hydrates

  // Fetch user stats, chores, and transactions
  // If viewing as child, the queryClient will automatically append userId parameter
  // Define better types for the API response
  interface StatsResponse {
    balance: number;
    activeGoal?: {
      id: number;
      user_id: number;
      product: {
        id: number;
        title: string;
        asin: string;
        image_url: string;
        price_cents: number;
        price_locked_cents?: number; // Legacy field, now using price_cents
      };
      tickets_saved: number;
      progress: number;
      overSavedTickets?: number;
      estimatedCompletion?: {
        days: number;
        weeks: number;
      };
    };
    chores?: any[];
  }

  const { data, isLoading, error, refetch } = useQuery<StatsResponse>({
    queryKey: ["/api/stats"],
    refetchInterval: 60000, // Refresh every minute
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

    // Also set up more specific handlers for transaction types
    const earningSubscription = subscribeToChannel(
      "transaction:earn",
      (data) => {
        // Handle transaction:earn events (similar code as above)
        const userId = data.data?.user_id || data.transaction?.user_id;
        const balance = data.data?.balance;

        if (userId === user?.id && balance !== undefined) {
          updateBalance(balance);
        }
      },
    );

    const spendingSubscription = subscribeToChannel(
      "transaction:spend",
      (data) => {
        // Handle transaction:spend events
      },
    );

    const deductSubscription = subscribeToChannel(
      "transaction:deduct",
      (data) => {
        // Handle transaction:deduct events
      },
    );

    // Handle goal purchased events
    const goalPurchasedSubscription = subscribeToChannel(
      "goal:purchased",
      (data) => {
        console.log("Received goal:purchased event:", data);
        
        const purchaseData = data.data;
        const userId = purchaseData?.user_id;
        
        // Only process if it's for the current user
        if (userId === user?.id) {
          // Show success toast
          toast({
            title: "🎉 Goal Purchased!",
            description: `Successfully purchased ${purchaseData.product_name}! ${purchaseData.remaining_balance} tickets remaining.`,
            variant: "default",
          });
          
          // Update balance in the cache
          if (purchaseData.remaining_balance !== undefined) {
            queryClient.setQueryData(["/api/stats"], (oldData: any) => {
              return {
                ...oldData,
                balance: purchaseData.remaining_balance,
              };
            });
            updateBalance(purchaseData.remaining_balance);
          }
          
          // Refresh all relevant queries
          queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
          
          setTimeout(() => {
            refetch();
          }, 100);
        }
      },
    );

    // Clean up subscriptions on unmount
    return () => {
      console.log("Dashboard WebSocket subscriptions cleaned up");
      debugSubscription();
      generalTransactionSubscription();
      earningSubscription();
      spendingSubscription();
      deductSubscription();
      goalPurchasedSubscription();
    };
  }, [user?.id, toast, queryClient, refetch, updateBalance]);

  // Handle when a chore is completed (regular chore)
  const handleChoreComplete = async (choreId: number) => {
    console.log(`Chore ${choreId} completed. Updating UI.`);

    try {
      navigator.vibrate?.(24);
    } catch {}

    // We don't need to manually update the UI here because:
    // 1. The server will emit a transaction:earn WebSocket event
    // 2. Our WebSocket handler will update the UI
    // 3. The transaction table will automatically refresh

    // We still refetch just to be sure everything is in sync
    setTimeout(() => refetch(), 500);
  };

  // Handle when a bonus chore is completed
  const handleBonusChoreComplete = async (
    dailyBonusId: number,
    choreName: string,
  ) => {
    console.log(`Bonus chore completed. Daily bonus ID: ${dailyBonusId}`);

    setDailyBonusId(dailyBonusId);
    setCompletedChoreName(choreName);

    // Show the spin prompt
    setIsSpinPromptOpen(true);
  };

  // Handle when user initiates the spin from the prompt
  const handleUserInitiatesSpin = () => {
    console.log("User initiated spin. Opening bonus wheel modal.");

    // Close the prompt and open the wheel modal
    setIsSpinPromptOpen(false);
    setIsBonusWheelModalOpen(true);
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
      />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
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

            {/* Parent/Child View Switch */}
            {viewingChild && (
              <Button
                variant="outline"
                onClick={() => resetChildView()}
                className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/50"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Back to Parent View
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Child view indicator */}
        {viewingChild && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <UserIcon className="h-4 w-4 text-amber-800 dark:text-amber-300" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              You are viewing {user?.name}'s dashboard. All actions will affect
              their account.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <MobileSectionTabs />
            {/* Parent Dashboard - Only visible when not viewing a child */}
            {user?.role === "parent" && !viewingChild ? (
              <>
                {/* Child Selection and Parent Actions */}
                <section className="mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-0">
                          Parent Controls
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <BadBehaviorDialog>
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                            >
                              <MinusCircleIcon className="w-4 h-4 mr-1" /> Bad
                              Behavior
                            </Button>
                          </BadBehaviorDialog>
                          <GoodBehaviorDialog>
                            <Button
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950 dark:hover:text-green-300"
                            >
                              <PlusCircleIcon className="w-4 h-4 mr-1" /> Good
                              Behavior
                            </Button>
                          </GoodBehaviorDialog>
                          <Button
                            variant="outline"
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-900 dark:hover:bg-indigo-950"
                            onClick={() => (window.location.href = "/catalog")}
                          >
                            <ShoppingCartIcon className="w-4 h-4 mr-1" />{" "}
                            Purchase
                          </Button>
                        </div>
                      </div>

                      {/* Child Summary Cards */}
                      <div className="mb-2">
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Child Profiles
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {childSummaries.length > 0 ? (
                            childSummaries.map((child) => (
                              <div
                                key={child.id}
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => {
                                  const childUser = childUsers.find(
                                    (u) => u.id === child.id,
                                  );
                                  if (childUser) {
                                    switchChildView(childUser);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold">
                                    {child.name}
                                  </h5>
                                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                                    {child.balance} tickets
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Click to view/manage {child.name}'s dashboard
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full p-4 text-center text-gray-500 dark:text-gray-400">
                              No child profiles found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Daily Bonus Wheel Management */}
                <section className="mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Bonus Management
                      </h3>
                      <DailyBonusWheel />
                    </div>
                  </div>
                </section>

                {/* Recent Transactions */}
                <section className="mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
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
                      {isMobile ? (
                        <TransactionsMobile limit={10} />
                      ) : (
                        <TransactionsTableDesktop limit={10} />
                      )}
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <>
                {/* Child Dashboard - Visible to children or parents viewing as a child */}
                {/* Progress Summary */}
                <section className="mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Savings Progress
                        </h3>
                        <div className="flex items-center gap-4">
                          {/* Spend Tickets button moved to header */}
                        </div>
                      </div>

                      {data?.activeGoal ? (
                        <ProgressCard
                          goal={data.activeGoal}
                          onRefresh={refetch}
                        />
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

                {/* Daily Bonus Section */}
                <section className="mb-8">
                  <DailyBonusCard 
                    onBonusSpun={() => {
                      // Refresh dashboard data when bonus is collected
                      refetch();
                      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
                    }}
                  />
                </section>

                {/* Chores Section */}
                <section className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Today's Chores
                    </h3>
                    <div className="flex items-center space-x-2">
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

                {/* Recent Transactions */}
                <section>
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
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
