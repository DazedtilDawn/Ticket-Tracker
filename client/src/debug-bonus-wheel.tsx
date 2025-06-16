import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ChildBonusWheel } from "@/components/child-bonus-wheel";

/**
 * Debug tool for testing the daily bonus wheel flow
 * This component helps debug and test the daily bonus wheel by isolating the wheel component.
 */
export function BonusWheelDebugger() {
  const [wheelOpen, setWheelOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [bonusId, setBonusId] = useState<number | null>(null);
  const [childName, setChildName] = useState("");

  // Define user type
  interface User {
    id: number;
    name: string;
    username: string;
    role: string;
  }

  // Get all users to populate the dropdown
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  // Mutation to reset a daily bonus
  const resetBonusMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("/api/reset-daily-bonus", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }),
    onSuccess: (data) => {
      console.log("[DEBUG] Reset bonus success:", data);
      toast({
        title: "Bonus Reset",
        description: `Daily bonus has been reset for ${childName}`,
      });

      if (data.assignment) {
        setBonusId(data.assignment.id);
        toast({
          title: "New Bonus Ready",
          description: "A new bonus is ready to spin!",
        });
      }
    },
    onError: (error: any) => {
      console.error("[DEBUG] Reset bonus error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset bonus",
        variant: "destructive",
      });
    },
  });

  // Mutation to assign a new bonus
  const assignBonusMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("/api/assign-daily-bonus", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }),
    onSuccess: (data) => {
      console.log("[DEBUG] Assign bonus success:", data);

      if (data.daily_bonus) {
        setBonusId(data.daily_bonus.id);
        toast({
          title: "Bonus Assigned",
          description: `A new bonus has been assigned for ${childName}`,
        });
      }
    },
    onError: (error: any) => {
      console.error("[DEBUG] Assign bonus error:", error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign bonus",
        variant: "destructive",
      });
    },
  });

  // Handle child selection
  const handleSelectChild = (child: User) => {
    console.log("[DEBUG] Selected child:", child);
    setSelectedChildId(child.id);
    setChildName(child.name);
    setBonusId(null); // Reset bonus ID when changing child
  };

  // Handle reset bonus click
  const handleResetBonus = () => {
    if (!selectedChildId) {
      toast({
        title: "No Child Selected",
        description: "Please select a child first.",
        variant: "destructive",
      });
      return;
    }

    resetBonusMutation.mutate(selectedChildId);
  };

  // Handle assign bonus click
  const handleAssignBonus = () => {
    if (!selectedChildId) {
      toast({
        title: "No Child Selected",
        description: "Please select a child first.",
        variant: "destructive",
      });
      return;
    }

    assignBonusMutation.mutate(selectedChildId);
  };

  // Handle open wheel click
  const handleOpenWheel = () => {
    if (!bonusId) {
      toast({
        title: "No Bonus ID",
        description: "Please assign or reset a bonus first.",
        variant: "destructive",
      });
      return;
    }

    setWheelOpen(true);
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Bonus Wheel Debugger</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Select a Child</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {users &&
                users
                  .filter((u) => u.role === "child")
                  .map((child) => (
                    <Button
                      key={child.id}
                      variant={
                        selectedChildId === child.id ? "default" : "outline"
                      }
                      onClick={() => handleSelectChild(child)}
                      className="justify-start"
                    >
                      {child.name}
                    </Button>
                  ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 2: Reset or Assign Daily Bonus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <Button
              disabled={!selectedChildId || resetBonusMutation.isPending}
              onClick={handleResetBonus}
              className="flex-1"
            >
              {resetBonusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reset Daily Bonus
            </Button>
            <Button
              disabled={!selectedChildId || assignBonusMutation.isPending}
              onClick={handleAssignBonus}
              className="flex-1"
            >
              {assignBonusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign New Bonus
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          {bonusId ? (
            <p>Bonus ID: {bonusId} is ready to use</p>
          ) : (
            <p>No bonus currently assigned</p>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Open Bonus Wheel</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            disabled={!bonusId}
            onClick={handleOpenWheel}
            className="w-full"
            size="lg"
          >
            Open Bonus Wheel
          </Button>
        </CardContent>
      </Card>

      {/* Bonus Wheel Modal */}
      {selectedChildId && (
        <ChildBonusWheel
          isOpen={wheelOpen}
          onClose={() => setWheelOpen(false)}
          dailyBonusId={bonusId}
          childName={childName}
        />
      )}
    </div>
  );
}
