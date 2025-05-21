import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import { PurchaseDialog } from "@/components/purchase-dialog";
import { useAuthStore } from "@/store/auth-store";
import { useStatsStore } from "@/store/stats-store";
import { ticketsToUSD } from "@/lib/utils";
import ProgressRing from "@/components/ui/progress-ring";
import { TicketDisplay } from "@/components/ticket-display";

interface ChildDashboardHeaderProps {
  activeGoal?: { progress: number } | null;
}

export default function ChildDashboardHeader({ activeGoal }: ChildDashboardHeaderProps) {
  const { user, isViewingAsChild } = useAuthStore();
  const { balance } = useStatsStore();
  const viewingChild = isViewingAsChild();

  if (!user) return null;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const showPurchase = viewingChild || user.role === "child";

  const progress = activeGoal?.progress ?? 0;

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <ProgressRing percent={progress} radius={38} stroke={6}>
          <Avatar className="h-14 w-14 border">
            <AvatarImage src={user.profile_image_url || undefined} alt={user.name} />
            <AvatarFallback className="bg-primary-600 text-white text-sm">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </ProgressRing>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.name}
          </h2>
          <div className="mt-2">
            <TicketDisplay 
              balance={balance} 
              size="lg" 
              className="shadow-md hover:shadow-lg transition-shadow duration-300"
            />
          </div>
        </div>
      </div>
      {showPurchase && (
        <PurchaseDialog>
          <Button variant="outline" size="sm" className="flex items-center">
            <Ticket className="mr-1 h-4 w-4" /> Spend Tickets
          </Button>
        </PurchaseDialog>
      )}
    </div>
  );
}
