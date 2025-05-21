import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import { PurchaseDialog } from "@/components/purchase-dialog";
import { useAuthStore } from "@/store/auth-store";
import { useStatsStore } from "@/store/stats-store";
import { ticketsToUSD } from "@/lib/utils";

export default function ChildDashboardHeader() {
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

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <Avatar className="h-14 w-14 border">
          <AvatarImage src={user.profile_image_url || undefined} alt={user.name} />
          <AvatarFallback className="bg-primary-600 text-white text-sm">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.name}
          </h2>
          <div className="mt-1 flex items-center space-x-2">
            <div className="flex items-center space-x-2 rounded-lg bg-pink-100 dark:bg-purple-900 px-2 py-1">
              <Ticket className="h-5 w-5 text-pink-500 dark:text-purple-300" />
              <span className="text-xl font-bold text-pink-700 dark:text-purple-200">
                {balance}
              </span>
            </div>
            <span className="text-xs text-pink-600 dark:text-purple-400">
              {ticketsToUSD(balance)}
            </span>
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
