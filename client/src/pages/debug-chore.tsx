import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

export function DebugChorePage() {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);

  // Function to complete Bryce's cleaning bedroom chore
  const completeBryceChore = async () => {
    try {
      setIsLoading(true);

      // Complete Chore ID 1 (Clean Bedroom) for Bryce (user_id: 4)
      const response = await apiRequest("/api/earn", {
        method: "POST",
        body: JSON.stringify({
          chore_id: 1,
          user_id: 4,
        }),
      });

      console.log("Chore completion response:", response);

      toast({
        title: "Chore Completed!",
        description:
          "Bryce's bedroom cleaning chore has been marked as complete",
      });

      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete the chore",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to assign a new bonus to Kiki
  const assignNewBonusToKiki = async () => {
    try {
      setIsLoading(true);

      // Assign a new daily bonus to Kiki (user_id: 5)
      const response = await apiRequest("/api/assign-daily-bonus", {
        method: "POST",
        body: JSON.stringify({
          user_id: 5,
        }),
      });

      console.log("Bonus assignment response:", response);

      toast({
        title: "Bonus Assigned!",
        description: "A new bonus has been assigned to Kiki",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign a new bonus",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to award a good behavior bonus to Kiki
  const awardGoodBehaviorBonus = async () => {
    try {
      setIsLoading(true);

      // Award good behavior bonus to Kiki (user_id: 5)
      const response = await apiRequest("/api/good-behavior", {
        method: "POST",
        body: JSON.stringify({
          user_id: 5,
          rewardType: "spin", // This is what was missing - specifying we want a spin opportunity
          reason: "Outstanding behavior today",
        }),
      });

      console.log("Good behavior bonus response:", response);

      toast({
        title: "Good Behavior Bonus Added!",
        description:
          "Kiki received a good behavior bonus with spin opportunity",
      });

      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to award good behavior bonus",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only parents can access this page
  if (user?.role !== "parent") {
    return (
      <div className="container max-w-6xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only parent users can access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Debug Chores & Bonuses</CardTitle>
          <CardDescription>
            Use these tools to test bonus spin functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Complete Bryce's Bedroom Chore
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will mark Bryce's Clean Bedroom chore as complete, which
              should trigger a bonus spin opportunity.
            </p>
            <Button onClick={completeBryceChore} disabled={isLoading}>
              {isLoading ? "Processing..." : "Complete Bryce's Chore"}
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Assign New Bonus to Kiki
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will assign a new daily bonus to Kiki, allowing for a new
              spin opportunity.
            </p>
            <Button
              onClick={assignNewBonusToKiki}
              disabled={isLoading}
              variant="outline"
              className="mr-4"
            >
              {isLoading ? "Processing..." : "Assign Bonus to Kiki"}
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Award Good Behavior Bonus
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will award a good behavior bonus to Kiki with a spin
              opportunity.
            </p>
            <Button
              onClick={awardGoodBehaviorBonus}
              disabled={isLoading}
              variant="secondary"
            >
              {isLoading ? "Processing..." : "Award Good Behavior Bonus"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DebugChorePage;
