import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { TICKET_CENT_VALUE } from "../../../config/business";

interface WishlistCardProps {
  goal: {
    id: number;
    product: {
      id: number;
      title: string;
      asin: string;
      image_url: string;
      price_cents: number;
      price_locked_cents?: number; // Legacy field, deprecated
    };
    user_id: number;
    tickets_saved?: number; // Now calculated from balance
    is_active: boolean;
    progress: number;
  };
  onSetAsGoal: (id: number) => void;
  onDelete?: (id: number) => void;
  refreshList?: () => void;
}

export default function WishlistCard({
  goal,
  onSetAsGoal,
  onDelete,
  refreshList,
}: WishlistCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { product } = goal;

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      // First call any parent callback to update the UI immediately
      // This prevents duplicate delete attempts
      if (onDelete) {
        onDelete(goal.id);
      }

      await apiRequest(`/api/goals/${goal.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      toast({
        title: "Goal deleted",
        description: "The goal has been removed from your wishlist",
      });

      // Refresh the list if we have a refresh callback
      if (refreshList) {
        refreshList();
      }
    } catch (error: any) {
      // If we get a 404, it means the goal was already deleted - which is fine
      if (error?.status === 404) {
        toast({
          title: "Goal deleted",
          description: "The goal has been removed from your wishlist",
        });
      } else {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to delete goal",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate tickets needed - standardized to 25 cents per ticket
  const ticketsNeeded = Math.ceil(
    product.price_cents / TICKET_CENT_VALUE,
  );

  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Generate Amazon product URL
  const amazonUrl = `https://www.amazon.com/dp/${product.asin}`;

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <img
        src={
          product.image_url ||
          "https://placehold.co/500x300/e5e7eb/a1a1aa?text=No+Image"
        }
        alt={product.title}
        className="w-full h-48 object-contain bg-slate-100"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src =
            "https://placehold.co/500x300/e5e7eb/a1a1aa?text=Image+Error";
        }}
      />

      <CardContent className="p-4">
        <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
          {product.title}
        </h4>
        <div className="mt-1 flex items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Price:
          </span>
          <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
            {formatPrice(product.price_cents)}
          </span>
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            ({ticketsNeeded} tickets)
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {Math.floor(goal.progress)}%
            </span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        <div className="mt-4 flex flex-col space-y-3">
          {/* Controls row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="link"
                size="sm"
                className="text-gray-500 dark:text-gray-400 p-0"
                asChild
              >
                <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
                  View on Amazon
                </a>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete from wishlist?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove this item from your
                      wishlist? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Status indicator */}
            {goal.is_active && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-md">
                Active Goal
              </span>
            )}
          </div>

          {/* Set as goal button - always displayed for debugging purposes */}
          <Button
            onClick={() => onSetAsGoal(goal.id)}
            size="default"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 mt-2"
            disabled={goal.is_active}
          >
            {goal.is_active ? "Current Active Goal" : "Set as Active Goal"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
