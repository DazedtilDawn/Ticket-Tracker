import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { useStatsStore } from "@/store/stats-store";
import { createWebSocketConnection, subscribeToChannel, sendMessage } from "@/lib/supabase";
import ProgressCard from "@/components/progress-card";
import ChoreCard from "@/components/chore-card";
import TransactionsTable from "@/components/transactions-table";
import { NewChoreDialog } from "@/components/new-chore-dialog";
import { BadBehaviorDialog } from "@/components/bad-behavior-dialog";
import { GoodBehaviorDialog } from "@/components/good-behavior-dialog";
import { DailyBonusWheel } from "@/components/daily-bonus-wheel";
import { SpinPromptModal } from "@/components/spin-prompt-modal";
import { ChildBonusWheel } from "@/components/child-bonus-wheel";
import { PurchaseDialog } from "@/components/purchase-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlusIcon, UserIcon, MinusCircleIcon, PlusCircleIcon, ShoppingCartIcon, BarChart3Icon, Ticket } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isViewingAsChild, originalUser, setFamilyUsers, switchChildView, resetChildView, getChildUsers } = useAuthStore();
  const { balance, updateBalance } = useStatsStore();
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
  const [childSummaries, setChildSummaries] = useState<{id: number, name: string, balance: number}[]>([]);
  
  // State to track last received WebSocket events for debugging
  const [lastWsEvents, setLastWsEvents] = useState<string[]>([]);
  
  // Load family users for the behavior dialogs and child summaries
  useEffect(() => {
    // Always fetch family users on dashboard load to ensure they're available for the behavior dialogs
    const loadFamilyUsers = async () => {
      try {
        console.log("Attempting to load family users...");
        // Use the apiRequest helper to ensure proper token handling
        const users = await apiRequest('/api/users', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        // Store all users in the auth store so they're available for the behavior dialogs
        if (users && Array.isArray(users)) {
          setFamilyUsers(users);
          console.log("Successfully loaded family users:", users);
          
          // Load balance data for each child user (only Kiki and Bryce)
          if (user?.role === 'parent') {
            const children = users.filter(u => 
              u.role === 'child' && (u.name === 'Kiki' || u.name === 'Bryce')
            );
            const summaries = await Promise.all(
              children.map(async (child) => {
                try {
                  const stats = await apiRequest(`/api/stats?user_id=${child.id}`, { method: 'GET' });
                  return {
                    id: child.id,
                    name: child.name,
                    balance: stats?.balance || 0
                  };
                } catch (err) {
                  console.error(`Failed to load stats for child ${child.name}:`, err);
                  return {
                    id: child.id,
                    name: child.name,
                    balance: 0
                  };
                }
              })
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
          description: "Could not load family members. Some features may not work correctly.",
          variant: "destructive"
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

  useEffect(() => {
    if (!activeChildId) return;        // store not hydrated yet

    const checkForUnspunBonus = async () => {
      try {
        console.log("[Bonus] polling /unspun for id:", activeChildId);

        const response = await apiRequest(
          `/api/daily-bonus/unspun?user_id=${activeChildId}`,
          { method: "GET" }
        );
        
        // If we found an unspun daily bonus, open the spin prompt
        if (response && response.daily_bonus_id) {
          console.log("Found unspun bonus:", response);
          // Set up the data for the spin prompt modal
          setDailyBonusId(response.daily_bonus_id);
          setCompletedChoreName(response.chore_name || "Daily Bonus");
          setIsSpinPromptOpen(true);
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
            message: errorMessage
          });
        }
      }
    };
    
    // Run once now, then every 30 s
    checkForUnspunBonus();
    const id = setInterval(checkForUnspunBonus, 30_000);
    return () => clearInterval(id);
  }, [activeChildId]);   // ← re-run when child changes or store hydrates
  
  // Fetch user stats, chores, and transactions
  // If viewing as child, the queryClient will automatically append userId parameter
  // Define better types for the API response
  interface StatsResponse {
    balance: number;
    activeGoal?: {
      id: number;
      product: any;
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
      setLastWsEvents(prev => [eventInfo, ...prev.slice(0, 4)]);
    });
    
    // Global handler for ALL transaction events to ensure nothing is missed
    const generalTransactionSubscription = subscribeToChannel("transaction:", (data) => {
      console.log("Received any transaction event - general handler:", data);
      
      // Extract the user ID from the transaction data
      const transactionUserId = data.data?.user_id;
      
      // Add the transaction event to our debug panel with more details
      const timestamp = new Date().toLocaleTimeString();
      const txType = data.event.split(':')[1] || 'unknown';
      // Handle both old and new field names for compatibility
      const txAmount = data.data?.delta_tickets !== undefined ? 
                     data.data.delta_tickets : 
                     (data.data?.amount !== undefined ? data.data.amount : '?');
      const eventDetails = `${timestamp} - 💰 ${txType} ${txAmount} tickets`;
      setLastWsEvents(prev => [eventDetails, ...prev.slice(0, 4)]);
      
      console.log(`General transaction handler - Current user ID: ${user?.id}, transaction for user ID: ${transactionUserId}`);
      
      // Only show toast and update UI if this transaction is for the current user
      if (transactionUserId === user?.id) {
        console.log("Transaction is for current user, showing toast and updating UI");
        
        // Show a toast notification for the transaction
        toast({
          title: `Transaction: ${txType}`,
          description: `${txAmount} tickets - ${data.data?.note || data.data?.description || ''}`,
          variant: txAmount > 0 ? "default" : "destructive"
        });
        
        // Check if the server sent a new balance for immediate UI update
        if (data.data?.balance !== undefined) {
          console.log(`Updating balance directly in the cache: ${data.data.balance}`);
          // Update the balance directly in the cache
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            return {
              ...oldData,
              balance: data.data.balance
            };
          });
        }
        
        // Immediately invalidate all relevant queries to ensure UI updates
        console.log("Invalidating and refreshing ALL transaction and stats queries");
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        
        // Force immediate refetches of ALL related queries with a small delay to ensure backend has processed changes
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ["/api/stats"] });
          queryClient.refetchQueries({ queryKey: ["/api/transactions"], exact: false });
          
          // Specifically refresh the dashboard stats
          refetch();
        }, 100);
      } else {
        console.log("Transaction is for a different user, not updating current user's UI");
      }
    });
    
    // Specific handlers for different transaction types (for UI notifications)
    const earningSubscription = subscribeToChannel("transaction:earn", (data) => {
      console.log("Received transaction:earn event:", data);
      // Handle both formats: data.transaction or data.data
      const tickets = data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
      const userId = data.data?.user_id || data.transaction?.user_id;
      const balance = data.data?.balance;
      const note = data.data?.note || data.transaction?.note || "";
      
      console.log(`Current user ID: ${user?.id}, transaction for user ID: ${userId}`);
      console.log(`Transaction data:`, { tickets, userId, balance, note });
      
      // Only update UI and show notifications if this transaction is for the current user
      if (userId === user?.id) {
        console.log("Transaction is for current user, updating UI with new balance:", balance);
        
        // If server sent the new balance, update it directly in the UI for immediate feedback
        if (balance !== undefined) {
          console.log("Applying direct balance update to cache and stats store:", balance);
          
          // Update the centralized stats store for immediate UI updates across all components
          updateBalance(balance);
          
          // Also update the query cache to keep everything in sync
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            if (!oldData) return oldData;
            console.log("Updating stats cache with new balance", { oldBalance: oldData.balance, newBalance: balance });
            return {
              ...oldData,
              balance: balance
            };
          });
        }
        
        // Show a toast notification about the transaction
        toast({
          title: "Tickets Earned",
          description: `${tickets} tickets earned - ${note}`,
        });
        
        // Force immediate query invalidation and refreshes for this specific event
        console.log("Transaction:earn event - forcing complete data refresh cycle");
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        
        // Small delay to ensure backend has processed all changes
        setTimeout(() => {
          // Force immediate refetch of all transaction-related queries
          queryClient.refetchQueries({ queryKey: ["/api/transactions"], exact: false });
          queryClient.refetchQueries({ queryKey: ["/api/stats"] });
        }, 100);
      } else {
        console.log("Transaction is for a different user, not updating current user's balance");
      }
    });
    
    const spendingSubscription = subscribeToChannel("transaction:spend", (data) => {
      console.log("Received transaction:spend event:", data);
      // Handle both formats: data.transaction or data.data
      const tickets = data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
      const userId = data.data?.user_id || data.transaction?.user_id;
      
      console.log(`Current user ID: ${user?.id}, transaction for user ID: ${userId}`);
      
      // Only update UI if this transaction is for the current user
      if (userId === user?.id) {
        console.log("Transaction is for current user, updating UI with new balance");
        
        // If server sent the new balance, update it directly in the UI
        if (data.data?.balance !== undefined) {
          console.log("Updating stats cache with new balance:", data.data.balance);
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            return {
              ...oldData,
              balance: data.data.balance
            };
          });
        }
        
        // Show toast notification for the user
        toast({
          title: "Tickets Spent",
          description: `${Math.abs(tickets)} tickets spent`,
        });
      } else {
        console.log("Transaction is for a different user, not updating current user's balance");
      }
      
      // Whether it's for this user or not, we should refresh all transaction data
      // to ensure the transactions table is up-to-date for parents viewing child accounts
      console.log("Transaction:spend event - forcing complete data refresh cycle");
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Add a small delay to ensure backend has processed all changes
      setTimeout(() => {
        // Force immediate refetch of all transaction-related queries
        console.log("Executing delayed refetch for transaction:spend event");
        queryClient.refetchQueries({ queryKey: ["/api/transactions"], exact: false });
        queryClient.refetchQueries({ queryKey: ["/api/stats"] });
      }, 100);
    });
    
    const deductionSubscription = subscribeToChannel("transaction:deduct", (data) => {
      console.log("Received transaction:deduct event:", data);
      // Handle both formats: data.transaction or data.data
      const tickets = data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
      const userId = data.data?.user_id || data.transaction?.user_id;
      
      console.log(`Current user ID: ${user?.id}, transaction for user ID: ${userId}`);
      
      // Only update UI if this transaction is for the current user
      if (userId === user?.id) {
        console.log("Transaction is for current user, updating UI with new balance");
        
        // If server sent the new balance, update it directly in the UI
        if (data.data?.balance !== undefined) {
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            return {
              ...oldData,
              balance: data.data.balance
            };
          });
        }
      } else {
        console.log("Transaction is for a different user, not updating current user's balance");
      }
      
      toast({
        title: "Tickets Deducted",
        description: `${Math.abs(tickets)} tickets deducted`,
      });
      // Force immediate query invalidation for this specific event
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    });
    
    const rewardSubscription = subscribeToChannel("transaction:reward", (data) => {
      console.log("Received transaction:reward event:", data);
      // Handle both formats: data.data or data.transaction
      const tickets = data.data?.delta_tickets || data.transaction?.delta_tickets || 0;
      const userId = data.data?.user_id || data.transaction?.user_id;
      
      console.log(`Current user ID: ${user?.id}, transaction for user ID: ${userId}`);
      
      // Only update UI if this transaction is for the current user
      if (userId === user?.id) {
        console.log("Transaction is for current user, updating UI with new balance");
        
        // If server sent the new balance, update it directly in the UI
        if (data.data?.balance !== undefined) {
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            return {
              ...oldData,
              balance: data.data.balance
            };
          });
        }
      } else {
        console.log("Transaction is for a different user, not updating current user's balance");
      }
      
      toast({
        title: "Bonus Tickets",
        description: `${tickets} bonus tickets awarded`,
      });
      // Force immediate query invalidation for this specific event
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    });
    
    // Handler for transaction:delete events to update the goal progress meter
    const deleteSubscription = subscribeToChannel("transaction:delete", (data) => {
      console.log("Received transaction:delete event:", data);
      
      // Extract the user ID and updated balance - could be in data.data or directly in data
      const userId = data.data?.user_id || data.user_id;
      const balance = data.data?.balance || data.balance;
      const goal = data.data?.goal || data.goal;
      
      console.log(`Transaction delete - Current user ID: ${user?.id}, affected user ID: ${userId}`);
      
      // Only update UI if this transaction is for the current user or the child we're viewing
      if (userId === user?.id) {
        console.log("Transaction delete is for current user, updating UI with new balance and goal data");
        
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
            balance: balance
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
      console.log("Transaction:delete event - forcing complete data refresh cycle");
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Add a small delay to ensure backend processing is complete
      setTimeout(() => {
        console.log("Executing delayed refetch for transaction:delete event");
        // Force immediate refetch of ALL transaction-related queries with exact=false to catch any with parameters
        queryClient.refetchQueries({ queryKey: ["/api/transactions"], exact: false });
        queryClient.refetchQueries({ queryKey: ["/api/stats"] });
        
        // Force a refetch of the dashboard stats specifically
        refetch();
      }, 100);
    });
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      debugSubscription(); // Unsubscribe from the debug handler
      generalTransactionSubscription(); // Unsubscribe from the general handler
      earningSubscription();
      spendingSubscription();
      deductionSubscription();
      rewardSubscription();
      deleteSubscription(); // Unsubscribe from delete events
      console.log("Dashboard WebSocket subscriptions cleaned up");
    };
  }, [queryClient, toast]);
  
  // Handle earn transaction completion (from child components)
  const handleChoreComplete = async (choreId: number) => {
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
        console.log("Updating balance from chore completion:", response.balance);
        updateBalance(response.balance);
      }
      
      // Check if this chore completion triggered a bonus
      if (response && response.bonus_triggered === true && response.daily_bonus_id) {
        console.log("Bonus chore triggered! Opening spin modal with bonus ID:", response.daily_bonus_id);
        // Pass the chore info to the bonus handler to open the spin modal
        handleBonusChoreComplete(
          response.daily_bonus_id,
          response.chore ? response.chore.name : "Daily Bonus Chore"
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
      const response = await apiRequest("/api/bonus-spin", {
        method: "POST",
        body: JSON.stringify({ daily_bonus_id: bonusId }),
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
        respinAllowed: response.respin_allowed
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
      />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            {/* Show profile avatar for child view */}
            {viewingChild && (
              <div className="hidden sm:block">
                <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-700">
                  <AvatarImage 
                    src={user?.profile_image_url || undefined} 
                    alt={`${user?.name}'s profile`} 
                  />
                  <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
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
      
      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Child view indicator */}
        {viewingChild && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <UserIcon className="h-4 w-4 text-amber-800 dark:text-amber-300" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              You are viewing {user?.name}'s dashboard. All actions will affect their account.
            </AlertDescription>
          </Alert>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Savings Progress</h3>
                    <div className="flex items-center gap-4">
                      {/* Enhanced ticket balance display with larger graphics */}
                      <div className="flex items-center bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow-sm">
                        <div className="relative mr-3">
                          <div className="relative">
                            <Ticket className="h-12 w-12 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                                {balance || data?.balance || 0}
                              </span>
                            </div>
                          </div>
                          <div className="absolute -right-1 -top-1">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800">
                              {user?.role === 'child' ? '🎯' : '👑'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80 font-medium">
                            Current Balance
                          </span>
                          <span className="text-lg font-bold text-amber-800 dark:text-amber-300">
                            {balance || data?.balance || 0} Tickets
                          </span>
                          <span className="text-xs text-amber-600/80 dark:text-amber-500/80">
                            Worth: ${((balance || data?.balance || 0) * 0.25).toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                      
                      {/* Purchase Button - Only show for child or when viewing as child */}
                      {(viewingChild || user?.role === 'child') && (
                        <PurchaseDialog onCompleted={() => refetch()}>
                          <Button 
                            variant="outline" 
                            size="default"
                            className="flex items-center text-primary-600 border-primary-200 hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:border-primary-900 dark:hover:bg-primary-950 dark:hover:text-primary-300 h-12"
                          >
                            <ShoppingCartIcon className="mr-2 h-5 w-5" />
                            Spend Tickets
                          </Button>
                        </PurchaseDialog>
                      )}
                    </div>
                  </div>
                  
                  {data?.activeGoal ? (
                    <ProgressCard goal={data.activeGoal} onRefresh={refetch} />
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No active goal set. Visit the wishlist page to add a goal.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
            
            {/* Chores Section */}
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Chores</h3>
                <div className="flex items-center space-x-2">
                  {!viewingChild && user?.role === 'parent' && (
                    <>
                      <BadBehaviorDialog>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300">
                          <MinusCircleIcon className="w-4 h-4 mr-1" /> Bad Behavior
                        </Button>
                      </BadBehaviorDialog>
                      <GoodBehaviorDialog>
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950 dark:hover:text-green-300">
                          <PlusCircleIcon className="w-4 h-4 mr-1" /> Good Behavior
                        </Button>
                      </GoodBehaviorDialog>
                      <PurchaseDialog>
                        <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:border-indigo-900 dark:hover:bg-indigo-950">
                          <ShoppingCartIcon className="w-4 h-4 mr-1" /> Purchase
                        </Button>
                      </PurchaseDialog>
                    </>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">Filter by:</span>
                  <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 pl-3 pr-8">
                    <option>All</option>
                    <option>Completed</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.chores && data.chores.length > 0 ? (
                  data.chores.map(chore => (
                    <ChoreCard 
                      key={chore.id} 
                      chore={chore} 
                      onComplete={handleChoreComplete}
                      onBonusComplete={handleBonusChoreComplete}
                    />
                  ))
                ) : (
                  <div className="col-span-3 p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No chores available.</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* Daily Bonus Wheel - Only visible to parents */}
            {!viewingChild && user?.role === 'parent' && (
              <section className="mb-8">
                <DailyBonusWheel />
              </section>
            )}
            
            {/* Recent Transactions */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                <a href="/transactions" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                  View All
                </a>
              </div>
              
              <TransactionsTable limit={5} />
            </section>
            
            {/* WebSocket Debug Panel - visible to all users for testing */}
              <section className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${lastWsEvents.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    WebSocket Debug Monitor
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Add timestamp to message to track round-trip time
                      const timestamp = new Date().toISOString();
                      const success = sendMessage('client:ping', { timestamp });
                      
                      // Record the test attempt in our event log
                      const attemptMsg = `${new Date().toLocaleTimeString()} - Test ping sent (${success ? 'OK' : 'FAILED'})`;
                      setLastWsEvents(prev => [attemptMsg, ...prev.slice(0, 4)]);
                      
                      toast({
                        title: success ? "Ping sent" : "Ping failed",
                        description: success 
                          ? "Testing WebSocket connection... Check for response."
                          : "Could not send ping. Connection may be closed.",
                        variant: success ? "default" : "destructive"
                      });
                    }}
                  >
                    Test Connection
                  </Button>
                </div>
                {lastWsEvents.length > 0 ? (
                  <div className="text-sm font-mono">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Last 5 events received:</p>
                    <ul className="space-y-1">
                      {lastWsEvents.map((event, i) => (
                        <li key={i} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{event}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No WebSocket events received yet. Try refreshing or performing an action.</p>
                )}
              </section>
            </>
          )}
      </div>
    </>
  );
}
