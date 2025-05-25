import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  AlertCircle,
  Check,
  Award,
  Edit,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Chore = {
  id: number;
  name: string;
  base_tickets: number;
  emoji: string | null;
  is_active: boolean;
  last_bonus_assigned: string | null;
};

type User = {
  id: number;
  name: string;
  username: string;
};

type DailyBonusAssignment = {
  user: User;
  bonus: {
    id: number;
    assigned_chore_id: number | null;
    is_override: boolean;
    is_spun: boolean;
    bonus_date: string;
  } | null;
  assigned_chore: Chore | null;
};

type DailyBonusAssignments = Record<string, DailyBonusAssignment>;

export function DailyBonusAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // For keeping track of which child's dropdown is open for changing their bonus chore
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Fetch all assignments for the current date
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    isError: isAssignmentsError,
    error: assignmentsError,
  } = useQuery({
    queryKey: ["/api/daily-bonus/assignments", selectedDate],
    queryFn: () =>
      apiRequest(`/api/daily-bonus/assignments?date=${selectedDate}`),
  });

  // Fetch available chores for override selection
  const { data: choresData, isLoading: isLoadingChores } = useQuery({
    queryKey: ["/api/chores"],
    queryFn: () => apiRequest("/api/chores"),
  });

  // Mutation for overriding a child's daily bonus assignment
  const assignMutation = useMutation({
    mutationFn: (data: { user_id: number; chore_id: number; date: string }) =>
      apiRequest("/api/daily-bonus/assign", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    onSuccess: () => {
      // Invalidate and refetch assignments data
      queryClient.invalidateQueries({
        queryKey: ["/api/daily-bonus/assignments"],
      });

      toast({
        title: "Assignment Updated",
        description: "The daily bonus chore has been successfully updated.",
      });

      // Close the editing state
      setEditingUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Assignment",
        description:
          error.message || "Failed to update the daily bonus assignment.",
        variant: "destructive",
      });
    },
  });

  // Function to assign a new bonus chore to a child
  const handleAssignBonusChore = (userId: number, choreId: number) => {
    assignMutation.mutate({
      user_id: userId,
      chore_id: choreId,
      date: selectedDate,
    });
  };

  // Prepare assignments for display (convert from object to array)
  const assignments: DailyBonusAssignment[] =
    assignmentsData &&
    typeof assignmentsData === "object" &&
    !Array.isArray(assignmentsData)
      ? Object.values(assignmentsData as DailyBonusAssignments)
      : [];

  // Debug assignments data
  console.log("[ASSIGNMENTS_DEBUG] Assignments data:", {
    hasData: !!assignmentsData,
    type: assignmentsData ? typeof assignmentsData : "none",
    isArray: assignmentsData ? Array.isArray(assignmentsData) : false,
    length: assignments.length,
  });

  // Filter chores to only show active ones
  const activeChores =
    choresData?.filter((chore: Chore) => chore.is_active) || [];

  if (isAssignmentsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load daily bonus assignments:{" "}
          {(assignmentsError as Error)?.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
            <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Daily Bonus Assignments
          </h2>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
          <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedDate}</span>
        </div>
      </div>

      <Separator />

      {isLoadingAssignments ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : assignments.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Assignments</AlertTitle>
          <AlertDescription>
            No child accounts found or no bonus assignments have been made for
            today.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <Card
              key={assignment.user.id}
              className={cn(
                "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300",
                assignment.bonus?.is_spun && "opacity-75"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">{assignment.user.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {assignment.bonus?.is_override && (
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                        Parent Override
                      </span>
                    )}
                    {assignment.bonus?.is_spun ? (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Complete
                      </span>
                    ) : (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium px-2.5 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  @{assignment.user.username}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {assignment.bonus ? (
                  assignment.assigned_chore ? (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800/30">
                      <div className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1.5 uppercase tracking-wide">
                        Bonus Chore
                      </div>
                      <div className="flex items-center gap-3">
                        {assignment.assigned_chore.emoji && (
                          <span className="text-2xl">
                            {assignment.assigned_chore.emoji}
                          </span>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {assignment.assigned_chore.name}
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            +{assignment.assigned_chore.base_tickets} bonus tickets
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg p-3 flex items-center gap-2 border border-amber-200 dark:border-amber-800/30">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">No chore assigned for today</span>
                    </div>
                  )
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg p-3 text-sm text-center">
                    No bonus has been assigned for today
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-3 pb-4">
                {editingUserId === assignment.user.id ? (
                  <div className="w-full">
                    <Select
                      onValueChange={(choreId) =>
                        handleAssignBonusChore(
                          assignment.user.id,
                          parseInt(choreId),
                        )
                      }
                      disabled={isLoadingChores || assignMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a new bonus chore" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeChores.map((chore: Chore) => (
                          <SelectItem
                            key={chore.id}
                            value={chore.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              {chore.emoji && <span>{chore.emoji}</span>}
                              <span>{chore.name}</span>
                              <span className="text-muted-foreground">
                                ({chore.base_tickets} tickets)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUserId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant={assignment.bonus?.is_spun ? "secondary" : "outline"}
                    size="sm"
                    className="w-full h-10 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setEditingUserId(assignment.user.id)}
                    disabled={
                      assignment.bonus?.is_spun || assignMutation.isPending
                    }
                  >
                    {assignMutation.isPending &&
                    assignMutation.variables?.user_id === assignment.user.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : assignment.bonus?.is_spun ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        Wheel Already Spun
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Change Bonus Chore
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
