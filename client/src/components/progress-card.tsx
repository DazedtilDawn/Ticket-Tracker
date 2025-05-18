import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";

interface ProgressCardProps {
  goal: {
    id: number;
    user_id: number;
    product: {
      id: number;
      title: string;
      asin: string;
      image_url: string;
      price_cents: number;
      price_locked_cents: number;
    };
    tickets_saved: number;
    progress: number;
    estimatedCompletion?: {
      days: number;
      weeks: number;
    };
  };
  onRefresh: () => void;
}

export default function ProgressCard({ goal, onRefresh }: ProgressCardProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuthStore();
  
  // Format price in dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Generate Amazon product URL
  const amazonUrl = `https://www.amazon.com/dp/${goal.product.asin}`;
  
  // Calculate tickets needed - using 10 cents per ticket conversion
  const ticketsNeeded = Math.ceil(goal.product.price_locked_cents / 10);
  
  // Handle switching goals - navigate directly to wishlist for the current child
  const handleSwitchGoal = () => {
    try {
      // Navigate directly to the wishlist page with my-list tab active
      navigate("/wishlist?tab=my-list");
      
      toast({
        title: "Switch Goals",
        description: "Select a different goal from your wishlist.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to navigate to wishlist",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <img 
          src={goal.product.image_url || "https://placehold.co/300x300/e5e7eb/a1a1aa?text=No+Image"} 
          alt={goal.product.title} 
          className="w-16 h-16 object-cover rounded-md"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/300x300/e5e7eb/a1a1aa?text=Image+Error";
          }}
        />
        
        <div className="ml-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{goal.product.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Price: {formatPrice(goal.product.price_locked_cents)}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300">
                <i className="ri-ticket-2-line mr-1"></i>
                {ticketsNeeded} tickets needed
              </span>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                Progress: {goal.tickets_saved} of {ticketsNeeded} tickets saved
              </span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {Math.floor(goal.progress)}%
              </span>
            </div>
            <Progress value={goal.progress} className="h-2.5 animate-progress" />
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Est. completion:</span> {' '}
          {goal.estimatedCompletion ? (
            `${goal.estimatedCompletion.weeks > 0 
              ? `${goal.estimatedCompletion.weeks} ${goal.estimatedCompletion.weeks === 1 ? 'week' : 'weeks'}` 
              : `${goal.estimatedCompletion.days} ${goal.estimatedCompletion.days === 1 ? 'day' : 'days'}`} at current rate`
          ) : (
            'Not enough data to estimate'
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSwitchGoal}>
            Switch Goal
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
              View on Amazon
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
