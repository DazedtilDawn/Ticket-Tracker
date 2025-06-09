import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  TicketIcon,
} from "lucide-react";

/** Floating action bar with quick parent actions for child management */
export function QuickActionBar() {
  const { isViewingAsChild, user } = useAuthStore();
  const { toast } = useToast();
  const [isAddTicketsOpen, setIsAddTicketsOpen] = useState(false);
  const [isRemoveTicketsOpen, setIsRemoveTicketsOpen] = useState(false);
  const [ticketAmount, setTicketAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isViewingAsChild()) return null;

  const handleAddTickets = async () => {
    if (!ticketAmount || !reason.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter both ticket amount and reason.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("/api/transactions", {
        method: "POST",
        body: {
          user_id: user?.id,
          type: "earn",
          delta: parseInt(ticketAmount),
          source: "parent_bonus",
          note: reason,
        },
      });

      toast({
        title: "Tickets Added",
        description: `Added ${ticketAmount} tickets to ${user?.name}`,
      });

      setIsAddTicketsOpen(false);
      setTicketAmount("");
      setReason("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTickets = async () => {
    if (!ticketAmount || !reason.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter both ticket amount and reason.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("/api/transactions", {
        method: "POST",
        body: {
          user_id: user?.id,
          type: "deduct",
          delta: -parseInt(ticketAmount),
          source: "parent_deduction",
          note: reason,
        },
      });

      toast({
        title: "Tickets Removed",
        description: `Removed ${ticketAmount} tickets from ${user?.name}`,
      });

      setIsRemoveTicketsOpen(false);
      setTicketAmount("");
      setReason("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChoreComplete = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Quick chore completion will be available in the next update.",
    });
  };

  return (
    <div
      aria-label="Quick Parent Actions"
      className="fixed bottom-20 left-4 z-40 flex flex-col gap-2"
    >
      {/* Add Tickets Dialog */}
      <Dialog open={isAddTicketsOpen} onOpenChange={setIsAddTicketsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            aria-label="Add tickets"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            <TicketIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tickets to {user?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-amount">Number of Tickets</Label>
              <Input
                id="add-amount"
                type="number"
                value={ticketAmount}
                onChange={(e) => setTicketAmount(e.target.value)}
                placeholder="Enter number of tickets"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="add-reason">Reason</Label>
              <Input
                id="add-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you adding tickets?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddTicketsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTickets}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Adding..." : "Add Tickets"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Tickets Dialog */}
      <Dialog open={isRemoveTicketsOpen} onOpenChange={setIsRemoveTicketsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            className="shadow-lg"
            aria-label="Remove tickets"
          >
            <MinusIcon className="h-4 w-4 mr-1" />
            <TicketIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tickets from {user?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="remove-amount">Number of Tickets</Label>
              <Input
                id="remove-amount"
                type="number"
                value={ticketAmount}
                onChange={(e) => setTicketAmount(e.target.value)}
                placeholder="Enter number of tickets"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="remove-reason">Reason</Label>
              <Input
                id="remove-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you removing tickets?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRemoveTicketsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRemoveTickets}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? "Removing..." : "Remove Tickets"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Chore Complete Button */}
      <Button
        size="sm"
        variant="outline"
        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg"
        onClick={handleMarkChoreComplete}
        aria-label="Mark chore complete"
      >
        <CheckCircleIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}