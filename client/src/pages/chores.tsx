import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { useStatsStore } from "@/store/stats-store";
import {
  createWebSocketConnection,
  subscribeToChannel,
} from "@/lib/websocketClient";
import SwipeableChoreCard from "@/components/swipeable-chore-card";
import { SpinPromptModal } from "@/components/spin-prompt-modal";
import { ChildBonusWheel } from "@/components/child-bonus-wheel";
import { NewChoreDialog } from "@/components/new-chore-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";

export default function Chores() {
  const { user, isViewingAsChild: isViewingAsChildFn } = useAuthStore();
  const isViewingAsChild = isViewingAsChildFn();
  const { balance, updateBalance } = useStatsStore();
  const { toast } = useToast();
  const isParent = user?.role === "parent";

  // State for bonus spin prompt and wheel
  const [isSpinPromptOpen, setIsSpinPromptOpen] = useState(false);
  const [isBonusWheelModalOpen, setIsBonusWheelModalOpen] = useState(false);
  const [dailyBonusId, setDailyBonusId] = useState<number | null>(null);
  const [completedChoreName, setCompletedChoreName] = useState("");

  // Fetch all chores
  interface Chore {
    id: number;
    name: string;
    description: string | null;
    base_tickets: number;
    tier: string | null;
    is_active: boolean;
    emoji?: string | null;
  }

  const {
    data: chores = [],
    isLoading,
    refetch,
  } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });

  // Also fetch stats to get balance
  const { data: stats } = useQuery<{ balance: number }>({
    queryKey: ["/api/stats"],
  });

  // Update stats store when data changes
  useEffect(() => {
    if (stats && stats.balance !== undefined) {
      console.log("Initializing stats store from chores page:", stats.balance);
      updateBalance(stats.balance);
    }
  }, [stats, updateBalance]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    console.log("Setting up WebSocket listeners for chore events");

    // Ensure we have an active WebSocket connection
    createWebSocketConnection();

    // Subscribe to chore events (new, update, delete)
    const choreNewSubscription = subscribeToChannel("chore:new", (data) => {
      console.log("Received chore:new event:", data);
      // Invalidate the chores query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
    });

    const choreUpdateSubscription = subscribeToChannel(
      "chore:update",
      (data) => {
        console.log("Received chore:update event:", data);
        // Invalidate the chores query to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      },
    );

    const choreDeleteSubscription = subscribeToChannel(
      "chore:delete",
      (data) => {
        console.log("Received chore:delete event:", data);
        // Invalidate the chores query to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      },
    );

    // Subscribe to transaction events that might be related to chore completion
    const earningSubscription = subscribeToChannel(
      "transaction:earn",
      (data) => {
        console.log("Received transaction:earn event in chores:", data);

        // Handle both old format (data.transaction) and new format (data.data)
        const choreId = data.data?.chore_id || data.transaction?.chore_id;
        const userId = data.data?.user_id || data.transaction?.user_id;
        const balance = data.data?.balance;

        console.log("Transaction:earn details:", {
          choreId,
          userId,
          balance,
          currentUser: user?.id,
        });

        // Check if this transaction is for the current user to directly update their balance
        if (userId === user?.id && balance !== undefined) {
          console.log(
            "Updating stats store and cache with new balance:",
            balance,
          );

          // Update the centralized stats store
          updateBalance(balance);

          // Also directly update the stats cache with the new balance
          queryClient.setQueryData(["/api/stats"], (oldData: any) => {
            if (!oldData) return oldData;
            console.log("Old stats data:", oldData);
            return {
              ...oldData,
              balance: balance,
            };
          });
        }

        // Always invalidate queries to refresh data regardless of chore_id
        // This ensures the balance updates even for general transactions
        queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      },
    );

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      choreNewSubscription();
      choreUpdateSubscription();
      choreDeleteSubscription();
      earningSubscription();
    };
  }, [queryClient, user]);

  // Handle chore completion with detailed feedback
  const handleChoreComplete = async (choreId: number) => {
    try {
      // Create payload with chore_id and optionally user_id for child view
      const payload: any = { chore_id: choreId };

      // If a parent is viewing a child account, include the child's user ID
      if (isViewingAsChild && user && user.id) {
        payload.user_id = user.id;
        console.log("Adding user_id to payload for child view:", user.id);
      }

      console.log("Submitting chore completion with payload:", payload);

      // Make the API call to complete the chore
      const data = await apiRequest("/api/earn", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("Chore completed API response:", data);

      // Check if this was a bonus chore
      const isBonusChore = data.bonus_revealed && data.bonus_tickets > 0;

      // Calculate total tickets earned
      const totalTickets = data.transaction.delta_tickets;
      const regularTickets = totalTickets - (data.bonus_tickets || 0);

      // Immediately update the stats store and cache with the new balance
      // This ensures the balance updates in real-time without waiting for WebSocket events
      if (data.balance !== undefined) {
        console.log(
          "Directly updating stats store and cache with new balance from API response:",
          data.balance,
        );

        // Update the centralized stats store for immediate UI updates
        updateBalance(data.balance);

        // Also update the query cache
        queryClient.setQueryData(["/api/stats"], (oldData: any) => {
          if (!oldData) return oldData;
          console.log("Current stats data before update:", oldData);
          return {
            ...oldData,
            balance: data.balance,
          };
        });
      }

      // Display appropriate success message
      if (isBonusChore) {
        toast({
          title: "Bonus Chore Completed! 🎉",
          description: `You earned ${regularTickets} tickets + ${data.bonus_tickets} bonus tickets!`,
          variant: "default",
          className: "bg-yellow-50 border-yellow-200 text-yellow-900",
        });
      } else {
        toast({
          title: "Chore Completed!",
          description: `You earned ${totalTickets} tickets for completing this chore.`,
        });
      }

      // Refresh chores list to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      refetch();

      // Check if this chore completion triggered a bonus - use the bonus_triggered flag
      if (data && data.bonus_triggered === true && data.daily_bonus_id) {
        console.log(
          "Bonus chore triggered! Opening spin modal with bonus ID:",
          data.daily_bonus_id,
        );
        handleBonusChoreComplete(
          data.daily_bonus_id,
          data.chore ? data.chore.name : "Daily Bonus Chore",
        );
      }
    } catch (error: any) {
      // Handle error states with specific messages
      const errorMessage = error.message || "Failed to complete chore";

      // Check for specific errors
      let description = errorMessage;
      if (errorMessage.includes("already been completed today")) {
        description =
          "You've already completed this chore today. Try again tomorrow!";
      }

      toast({
        title: "Could Not Complete Chore",
        description: description,
        variant: "destructive",
      });
    }
  };

  // Toggle chore active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: number;
      is_active: boolean;
    }) => {
      return apiRequest(`/api/chores/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({
        title: "Chore updated",
        description: "The chore status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update chore",
        variant: "destructive",
      });
    },
  });

  // Delete chore
  const deleteChore = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/chores/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({
        title: "Chore deleted",
        description: "The chore has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chore",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (id: number, currentValue: boolean) => {
    toggleActiveMutation.mutate({ id, is_active: !currentValue });
  };

  const handleDeleteChore = (id: number) => {
    if (confirm("Are you sure you want to delete this chore?")) {
      deleteChore.mutate(id);
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
      />
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chores
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and track your daily tasks
            </p>
          </div>

          {isParent && (
            <div className="mt-4 sm:mt-0">
              <NewChoreDialog onChoreCreated={refetch}>
                <Button className="inline-flex items-center">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Chore
                </Button>
              </NewChoreDialog>
            </div>
          )}
        </div>
      </div>

      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Chores grid for children */}
            {!isParent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chores && chores.length > 0 ? (
                  chores
                    .filter((chore: Chore) => chore.is_active)
                    .map((chore: Chore) => (
                      <SwipeableChoreCard
                        key={chore.id}
                        chore={chore}
                        onComplete={handleChoreComplete}
                      />
                    ))
                ) : (
                  <div className="col-span-3 p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No chores available. Ask a parent to create some chores!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Admin table for parents */}
            {isParent && (
              <Card>
                <CardHeader>
                  <CardTitle>Chore Management</CardTitle>
                  <CardDescription>
                    Create, edit, and manage the chores list
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Emoji</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chores && chores.length > 0 ? (
                        chores.map((chore: Chore) => (
                          <TableRow key={chore.id}>
                            <TableCell className="font-medium">
                              {chore.name}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {chore.description || "No description"}
                            </TableCell>
                            <TableCell>{chore.base_tickets}</TableCell>
                            <TableCell>
                              <span className="text-xl">
                                {chore.emoji || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`
                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white
                                ${
                                  chore.tier === "common"
                                    ? "bg-gray-500"
                                    : chore.tier === "rare"
                                      ? "bg-blue-500"
                                      : "bg-purple-500"
                                }`}
                              >
                                {chore.tier}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={chore.is_active}
                                onCheckedChange={() =>
                                  handleToggleActive(chore.id, chore.is_active)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <NewChoreDialog
                                  chore={chore}
                                  onChoreCreated={refetch}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                </NewChoreDialog>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDeleteChore(chore.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No chores found. Create your first chore!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
