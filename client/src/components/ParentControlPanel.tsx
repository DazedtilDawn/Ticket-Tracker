import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  PlusCircleIcon, 
  MinusCircleIcon, 
  PlusIcon,
  X 
} from "lucide-react";
import { NewChoreDialog } from "@/components/new-chore-dialog";
import { BadBehaviorDialog } from "@/components/bad-behavior-dialog";
import { GoodBehaviorDialog } from "@/components/good-behavior-dialog";

/**
 * Floating panel that shows parent-only shortcuts
 * when the parent is impersonating a child.
 */
export function ParentControlPanel() {
  const { isViewingAsChild, resetChildView, user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isViewingAsChild()) return null;

  return (
    <aside
      aria-label="Parent Controls"
      className="fixed bottom-4 right-4 z-50 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header with child name and expand/collapse */}
      <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Viewing as {user?.name}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetChildView}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium">
            Quick Parent Actions
          </p>
          
          <div className="space-y-2">
            {/* Good Behavior Button */}
            <GoodBehaviorDialog initialChildId={user?.id}>
              <Button 
                size="sm" 
                className="w-full justify-start text-white bg-green-600 hover:bg-green-700"
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Reward Good Behavior
              </Button>
            </GoodBehaviorDialog>

            {/* Bad Behavior Button */}
            <BadBehaviorDialog initialChildId={user?.id}>
              <Button 
                size="sm" 
                variant="destructive" 
                className="w-full justify-start"
              >
                <MinusCircleIcon className="h-4 w-4 mr-2" />
                Address Bad Behavior
              </Button>
            </BadBehaviorDialog>

            {/* New Chore Button */}
            <NewChoreDialog onChoreCreated={() => {}}>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full justify-start"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Chore
              </Button>
            </NewChoreDialog>

            {/* Return to Parent Dashboard */}
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start"
              onClick={resetChildView}
            >
              <Settings className="h-4 w-4 mr-2" />
              Return to Parent View
            </Button>
          </div>
        </div>
      )}

      {/* Minimized state - just shows a small expand button */}
      {!isExpanded && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-xs font-medium"
          >
            Parent Actions
          </Button>
        </div>
      )}
    </aside>
  );
}