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
  
  // Calculate estimated time remaining for goal if available
  const estimatedTimeText = activeGoal?.progress ? 
    activeGoal.progress >= 100 ? 
      "Goal complete!" : 
      `${Math.ceil((100 - activeGoal.progress) / (activeGoal.progress * 0.1))} days left` 
    : "";

  return (
    <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-md">
      {/* Top section with avatar, name and tickets */}
      <div className="p-5 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ProgressRing percent={progress} radius={38} stroke={6} className="drop-shadow-sm">
              <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-700">
                <AvatarImage src={user.profile_image_url || undefined} alt={user.name} />
                <AvatarFallback className="bg-primary-600 text-white text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </ProgressRing>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.name}
              </h2>
              
              {/* Progress info */}
              {activeGoal && (
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                  {Math.round(progress)}% to goal {estimatedTimeText && `• ${estimatedTimeText}`}
                </p>
              )}
            </div>
          </div>
          
          {/* Ticket display - prominently featured */}
          <div className="flex flex-col items-end">
            <TicketDisplay 
              balance={balance} 
              size="lg" 
              className="shadow-md hover:shadow-lg transition-shadow duration-300"
            />
            
            {/* Spend tickets button */}
            {showPurchase && (
              <PurchaseDialog>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <Ticket className="mr-1 h-4 w-4" /> Spend Tickets
                </Button>
              </PurchaseDialog>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar at bottom */}
      {activeGoal && (
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-1000 ease-in-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
