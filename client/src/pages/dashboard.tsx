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
import { useSpinPromptEventHandler } from "@/components/spin-prompt-event-handler";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusIcon, UserIcon, MinusCircleIcon, PlusCircleIcon, ShoppingCartIcon } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isViewingAsChild, originalUser, setFamilyUsers } = useAuthStore();
  const { balance, updateBalance } = useStatsStore();
  const { toast } = useToast();
  const viewingChild = isViewingAsChild();
  const queryClient = useQueryClient();
  
  // State for bonus spin prompt and wheel
  const [isSpinPromptOpen, setIsSpinPromptOpen] = useState(false);
  const [isBonusWheelModalOpen, setIsBonusWheelModalOpen] = useState(false);
  const [dailyBonusId, setDailyBonusId] = useState<number | null>(null);
  const [completedChoreName, setCompletedChoreName] = useState("");
  
  // Use our custom hook to handle the good behavior reward dialog events
  useSpinPromptEventHandler({
    setDailyBonusId,
    setCompletedChoreName,
    setIsSpinPromptOpen
  });
  
  // Load family users for the behavior dialogs
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
  }, [setFamilyUsers, toast]);
  
  // State to track last received WebSocket events for debugging
  const [lastWsEvents, setLastWsEvents] = useState<string[]>([]);

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
          console.log("No unspun daily bonus found");
        }
      } catch (error: any) {
        console.error("Error checking for unspun bonus:", error);
        console.error("Unexpected error checking for unspun bonus:", error);
      }
    };

    // Check for unspun bonus on component mount and every 30 seconds
    checkForUnspunBonus();
    const interval = setInterval(checkForUnspunBonus, 30000);
    
    return () => clearInterval(interval);
  }, [activeChildId]);
  
  // Query for dashboard stats
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      // Get the target user ID based on whether we're viewing a child account
      const targetUserId = viewingChild ? user?.id : activeChildId;
      
      if (!targetUserId) {
        console.log("No target user ID available");
        return { balance: 0 };
      }
      
      console.log(`Fetching stats for user ID: ${targetUserId}`);
      
      // Fetch dashboard stats for the active user
      return apiRequest(`/api/stats?user_id=${targetUserId}`, {
        method: "GET",
      });
    },
    // Refresh automatically every 20 seconds since this is a 
    // dashboard with potentially frequent updates
    refetchInterval: 20000,
  });

  // Handle api errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try refreshing the page.",
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
    });

    const purchaseSubscription = subscribeToChannel("transaction:purchase", (data) => {
      console.log("Received transaction:purchase event:", data);
    });

    const choreSubscription = subscribeToChannel("chore:complete", (data) => {
      console.log("Received chore:complete event:", data);
    });

    // Clean up on unmount
    return () => {
      debugSubscription();
      generalTransactionSubscription();
      earningSubscription();
      purchaseSubscription();
      choreSubscription();
    };
  }, [user?.id, queryClient, toast, setLastWsEvents, refetch]);

  // Handle a chore being completed
  const handleChoreComplete = async (choreId: number) => {
    try {
      console.log(`Completing chore with ID: ${choreId}`);
      
      const response = await apiRequest("/api/chores/complete", {
        method: "POST",
        body: JSON.stringify({ chore_id: choreId }),
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
        onSpin={() => handleUserInitiatesSpin(dailyBonusId as number)}
        choreName={completedChoreName}
        childName={user?.name}
        dailyBonusId={dailyBonusId}
      />
      
      {/* Bonus Wheel Modal */}
      <ChildBonusWheel
        isOpen={isBonusWheelModalOpen}
        onClose={handleWheelComplete}
        dailyBonusId={dailyBonusId}
        childName={user?.name || "Child"}
        onSpin={handleSpinWheel}
      />
      
      <div className="container min-h-full flex flex-col">
        {/* Header Section */}
        <div className="py-4 flex justify-between items-center border-b">
          <div>
            <h1 className="text-2xl font-bold">
              {viewingChild ? `${user?.name}'s Dashboard` : 'Parent Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          
          {/* Actions Section - Different for parent vs child */}
          <div className="flex gap-2">
            {/* Parent Only Actions */}
            {!viewingChild && (
              <>
                <NewChoreDialog onCreated={refetch}>
                  <Button variant="outline" size="sm">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Chore
                  </Button>
                </NewChoreDialog>
                
                <BadBehaviorDialog onCompleted={refetch}>
                  <Button variant="outline" size="sm">
                    <MinusCircleIcon className="w-4 h-4 mr-2" />
                    Bad Behavior
                  </Button>
                </BadBehaviorDialog>
                
                <GoodBehaviorDialog onCompleted={refetch}>
                  <Button variant="outline" size="sm">
                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                    Good Behavior
                  </Button>
                </GoodBehaviorDialog>
              </>
            )}
            
            {/* Child Only Actions */}
            {viewingChild && (
              <PurchaseDialog onCompleted={refetch}>
                <Button variant="outline" size="sm">
                  <ShoppingCartIcon className="w-4 h-4 mr-2" />
                  Make a Purchase
                </Button>
              </PurchaseDialog>
            )}
            
            {/* Daily Bonus Button - open bonus wheel dialog */}
            <DailyBonusWheel />
          </div>
        </div>
        
        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              {/* Ticket Balance */}
              <div className="col-span-full lg:col-span-1 p-4 rounded-lg border shadow-sm">
                <h3 className="text-lg font-medium mb-2">Ticket Balance</h3>
                <p className="text-3xl font-bold">{stats?.balance || 0} 🎟️</p>
              </div>
              
              {/* Active Goal Progress */}
              {stats?.activeGoal ? (
                <div className="col-span-full lg:col-span-2">
                  <ProgressCard goal={stats.activeGoal} />
                </div>
              ) : (
                <div className="col-span-full lg:col-span-2 p-4 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-medium mb-2">No Active Goal</h3>
                  <p>
                    {viewingChild
                      ? "You don't have an active goal set. Would you like to pick something to save for?"
                      : "This child doesn't have an active goal set."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Chores Section */}
        <div className="py-4">
          <h2 className="text-xl font-bold mb-4">
            {viewingChild ? "Your Chores" : "Chores"}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <p>Loading chores...</p>
            ) : stats?.chores && stats.chores.length > 0 ? (
              stats.chores.map((chore) => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  viewingAsChild={viewingChild}
                  onComplete={handleChoreComplete}
                  onEdited={refetch}
                  onDeleted={refetch}
                />
              ))
            ) : (
              <div className="col-span-full">
                <Alert>
                  <AlertDescription>
                    No chores found. {!viewingChild && "Add some chores to get started!"}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
        
        {/* Transaction History Section */}
        <div className="py-4 flex-grow">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <TransactionsTable />
        </div>
        
        {/* WebSocket Events Debug Panel - only in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 border rounded-md bg-muted text-xs">
            <h3 className="font-bold mb-2">WebSocket Events (Debug)</h3>
            <div className="space-y-1">
              {lastWsEvents.length === 0 ? (
                <p>No events received yet...</p>
              ) : (
                lastWsEvents.map((event, i) => <div key={i}>{event}</div>)
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}