import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { createWebSocketConnection, subscribeToChannel } from "@/lib/websocketClient";

// UI Components
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { BonusBadge } from "@/components/bonus-badge";

export default function BonusManagement() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedChore, setSelectedChore] = useState<string>("");

  // Fetch users (to get list of children)
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch daily bonus assignments
  const { data: dailyBonusesData, isLoading: bonusesLoading, refetch: refetchBonuses } = useQuery({
    queryKey: ["/api/daily-bonus/assignments"],
  });

  // Fetch all chores for assignment
  const { data: chores, isLoading: choresLoading } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });

  // Filter for children users only
  const children = users?.filter((u: User) => u.role === "child") || [];

  // Set up WebSocket for real-time updates
  useEffect(() => {
    console.log("Setting up WebSocket listeners for bonus events");
    
    // Ensure we have an active WebSocket connection
    createWebSocketConnection();
    
    // Subscribe to bonus events
    const bonusAssignSubscription = subscribeToChannel("bonus:assign", (data) => {
      console.log("Received bonus:assign event:", data);
      // Refresh the assignments list
      refetchBonuses();
    });
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      bonusAssignSubscription();
    };
  }, [refetchBonuses]);

  // Assign a specific chore to a child's daily bonus
  const assignBonusMutation = useMutation({
    mutationFn: async ({ userId, choreId }: { userId: number; choreId: number }) => {
      console.log("Assigning chore ID", choreId, "to user ID", userId);
      return apiRequest("/api/daily-bonus/assign", {
        method: "PUT",
        body: JSON.stringify({ user_id: userId, chore_id: choreId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Bonus Assigned",
        description: "The daily bonus chore has been assigned successfully.",
      });
      refetchBonuses();
      setSelectedChild("");
      setSelectedChore("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign bonus chore",
        variant: "destructive",
      });
    },
  });

  // Assign daily bonuses automatically to all children
  const assignAllBonusesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/assign-daily-bonuses", {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bonuses Assigned",
        description: `Successfully assigned ${data.assigned} daily bonus chores.`,
      });
      refetchBonuses();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign bonus chores",
        variant: "destructive",
      });
    },
  });

  // Reset a specific child's daily bonus
  const resetBonusMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("/api/reset-daily-bonus", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data, userId) => {
      const childName = users?.find((u: any) => u.id === userId)?.name || 'Child';
      toast({
        title: "Bonus Reset",
        description: `Daily bonus for ${childName} has been reset and reassigned.`,
      });
      refetchBonuses();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset bonus chore",
        variant: "destructive",
      });
    },
  });

  // Handle assigning a bonus manually
  const handleAssignBonus = () => {
    if (!selectedChild || !selectedChore) {
      toast({
        title: "Missing Selection",
        description: "Please select both a child and a chore to assign.",
        variant: "destructive",
      });
      return;
    }

    assignBonusMutation.mutate({
      userId: parseInt(selectedChild),
      choreId: parseInt(selectedChore),
    });
  };

  // Handle automatic assignment for all children
  const handleAssignAllBonuses = () => {
    if (confirm("Assign daily bonus chores to all children?")) {
      assignAllBonusesMutation.mutate();
    }
  };

  // No longer need this function since we're using individual reset buttons
  // Keeping the stub for now to avoid modifying too many parts of the code
  const handleResetBonuses = () => {
    toast({
      title: "Reset Function Updated",
      description: "Please use the reset button next to each child to reset their daily bonus.",
    });
  };

  // Interface for daily bonus data
  interface DailyBonus {
    id: number;
    user_id: number;
    bonus_date: string;
    assigned_chore_id: number | null;
    is_override: boolean;
    is_spun: boolean;
    trigger_type: "chore_completion" | "good_behavior_reward" | "respin";
    spin_result_tickets: number | null;
    created_at: Date | null;
  }

  // Interface for user data
  interface User {
    id: number;
    name: string;
    username: string;
    role: string;
  }

  // Interface for chore data
  interface Chore {
    id: number;
    name: string;
    base_tickets: number;
    is_active: boolean;
  }

  // Get status badge for a bonus assignment
  const getBonusStatusBadge = (bonus: DailyBonus) => {
    if (bonus.is_spun) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Completed & Spun
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Assigned
        </Badge>
      );
    }
  };

  // Get the assigned chore name from the list
  const getAssignedChoreName = (choreId: number | null) => {
    if (!choreId || !chores) return "Unknown";
    const chore = chores.find((c: Chore) => c.id === choreId);
    return chore ? chore.name : "Unknown";
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user || user.role !== "parent") {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Only parents can access this page
        </h1>
      </div>
    );
  }

  // Process daily bonus assignments data from API
  const dailyBonuses: any[] = [];
  
  if (dailyBonusesData && typeof dailyBonusesData === 'object' && !Array.isArray(dailyBonusesData)) {
    // Log the data structure for debugging
    console.log('[BONUS_DEBUG] Raw data from API:', dailyBonusesData);
    
    // Process each child's data from the response
    Object.values(dailyBonusesData).forEach((assignment: any) => {
      if (assignment.bonus) {
        // Add user data to the bonus record for easier access
        dailyBonuses.push({
          ...assignment.bonus,
          user: assignment.user,
          assigned_chore: assignment.assigned_chore
        });
      }
    });
    
    console.log('[BONUS_DEBUG] Processed bonuses:', dailyBonuses);
  }
  
  const isLoading = usersLoading || bonusesLoading || choresLoading;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Daily Bonus Management</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage daily bonus chore assignments for children
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 space-x-2">
            <Button 
              onClick={handleAssignAllBonuses} 
              disabled={assignAllBonusesMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {assignAllBonusesMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Auto-Assign All
            </Button>
            
            <Button 
              onClick={() => refetchBonuses()} 
              variant="outline"
              className="ml-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
        {/* Manual Assignment Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Bonus Assignment</CardTitle>
            <CardDescription>
              Manually assign a daily bonus chore to a specific child
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Child
                </label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child: any) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Chore
                </label>
                <Select value={selectedChore} onValueChange={setSelectedChore}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a chore" />
                  </SelectTrigger>
                  <SelectContent>
                    {(chores || []).filter((c: Chore) => c.is_active).map((chore: Chore) => (
                      <SelectItem key={chore.id} value={chore.id.toString()}>
                        {chore.name} ({chore.base_tickets} tickets)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleAssignBonus} 
                  disabled={assignBonusMutation.isPending || !selectedChild || !selectedChore}
                  className="w-full"
                >
                  {assignBonusMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Assign Bonus"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Current Bonus Assignments</CardTitle>
              <CardDescription>
                Daily bonus chores assigned to children
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                if (confirm("Do you want to reset all daily bonus assignments? This will apply to all children.")) {
                  // Let the user know we need to select which child to reset
                  toast({
                    title: "Individual Reset Required",
                    description: "Please use the reset button next to each child to reset their daily bonus.",
                  });
                }
              }}
              variant="destructive" 
              size="sm"
            >
              Reset All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : dailyBonuses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Assigned Chore</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Assignment Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyBonuses.map((bonus: any) => {
                    // Find the child user
                    const child = users?.find((u: User) => u.id === bonus.user_id);
                    
                    return (
                      <TableRow key={bonus.id}>
                        <TableCell className="font-medium">{child?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{getAssignedChoreName(bonus.assigned_chore_id)}</span>
                            <BonusBadge variant="small" />
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(bonus.bonus_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            bonus.is_override 
                              ? "bg-purple-50 text-purple-700 border-purple-200" 
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }>
                            {bonus.is_override ? "Manual" : "Automatic"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getBonusStatusBadge(bonus)}</TableCell>
                        <TableCell>
                          {bonus.is_spun && bonus.spin_result_tickets !== null ? (
                            <span className="font-semibold text-primary-600">
                              +{bonus.spin_result_tickets} tickets
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!bonus.is_spun && (
                              <>
                                <Select 
                                  onValueChange={(value) => {
                                    // Handle override of bonus chore
                                    if (confirm(`Change ${child?.name}'s bonus chore?`)) {
                                      assignBonusMutation.mutate({
                                        userId: bonus.user_id,
                                        choreId: parseInt(value)
                                      });
                                    }
                                  }}
                                  defaultValue={bonus.assigned_chore_id?.toString()}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Change chore" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={bonus.assigned_chore_id ? bonus.assigned_chore_id.toString() : "null"}>
                                      Current: {getAssignedChoreName(bonus.assigned_chore_id)}
                                    </SelectItem>
                                  <SelectItem value="divider" disabled>
                                    ───────────────
                                  </SelectItem> {/* Divider */}
                                    {(chores || []).filter((c: Chore) => c.is_active && c.id !== bonus.assigned_chore_id).map((chore: Chore) => (
                                      <SelectItem key={chore.id} value={chore.id.toString()}>
                                        {chore.name} ({chore.base_tickets} tickets)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const childName = child?.name || 'this child';
                                if (confirm(`Reset daily bonus for ${childName}?`)) {
                                  resetBonusMutation.mutate(bonus.user_id);
                                }
                              }}
                              disabled={resetBonusMutation.isPending}
                            >
                              {resetBonusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : 'Reset'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No bonus assignments found for today.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
