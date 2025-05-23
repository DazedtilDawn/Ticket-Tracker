import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { createWebSocketConnection, subscribeToChannel } from "@/lib/websocketClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import WishlistCard from "@/components/wishlist-card";
import { SharedCatalog } from "@/components/shared-catalog";
import { AddProductDialog } from "@/components/add-product-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, ShoppingBag } from "lucide-react";

export default function FamilyCatalogPage() {
  const { user, isViewingAsChild, getChildUsers } = useAuthStore();
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Default tab logic based on role
  const isParentView = user?.role === 'parent' && !isViewingAsChild();
  const [activeTab, setActiveTab] = useState(isParentView ? "catalog" : "my-list");
  
  // No URL parameter handling for now - just use the default tab
  // We'll add this feature back once we resolve the type issues
  
  // Fetch user's goals
  const { 
    data: goals = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["/api/goals"],
  });
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    console.log("Setting up WebSocket listeners for wishlist goal updates");
    
    // Ensure we have an active WebSocket connection
    createWebSocketConnection();
    
    // Subscribe to transaction events that might affect goals
    const spendingSubscription = subscribeToChannel("transaction:spend", (data) => {
      console.log("Received transaction:spend event in wishlist:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    });

    const earningSubscription = subscribeToChannel("transaction:earn", (data) => {
      console.log("Received transaction:earn event in wishlist:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    });

    // Listen for goal or product updates from other sessions
    const goalUpdateSubscription = subscribeToChannel("goal:update", () => {
      console.log("Received goal:update event in wishlist");
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    });

    const goalDeleteSubscription = subscribeToChannel("goal:deleted", () => {
      console.log("Received goal:deleted event in wishlist");
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    });

    const productUpdateSubscription = subscribeToChannel("product:update", () => {
      console.log("Received product:update event in wishlist");
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    });
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      spendingSubscription();
      earningSubscription();
      goalUpdateSubscription();
      goalDeleteSubscription();
      productUpdateSubscription();
    };
  }, [queryClient]);
  
  // Activate a goal
  const activateGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      return apiRequest(`/api/goals/${goalId}/activate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Goal activated",
        description: "Your goal has been set as the active goal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate goal",
        variant: "destructive",
      });
    },
  });
  
  const handleSetAsGoal = (goalId: number) => {
    activateGoalMutation.mutate(goalId);
  };
  
  // Delete a goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      return apiRequest(`/api/goals/${goalId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your wishlist."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      });
    },
  });
  
  const handleGoalDeleted = (goalId: number) => {
    deleteGoalMutation.mutate(goalId);
  };
  
  // Add to wishlist from catalog
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!user) {
        throw new Error("User not logged in");
      }
      return apiRequest("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Added to wishlist",
        description: "The item has been added to your wishlist."
      });
      // Switch to my list tab
      setActiveTab("my-list");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlist",
        variant: "destructive",
      });
    },
  });
  
  const handleAddToWishlist = (productId: number) => {
    addToWishlistMutation.mutate(productId);
  };
  
  // Separate active goals
  const activeGoal = goals && Array.isArray(goals) ? goals.find((goal: any) => goal.is_active) : undefined;
  const wishlistGoals = goals && Array.isArray(goals) ? goals.filter((goal: any) => !goal.is_active) : [];
  
  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Wishlist</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track progress toward your family's wishlist items
            </p>
          </div>
          
          {/* Only show page-level "Add Item" if it's a child adding to their own wishlist, 
              otherwise parents use the "Add Product" within the SharedCatalog component context */}
          {(!isParentView) && (
            <div className="mt-4 sm:mt-0">
              <AddProductDialog onProductAdded={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                refetch();
              }}>
                <Button className="inline-flex items-center">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add New Item to My Wishlist
                </Button>
              </AddProductDialog>
            </div>
          )}
        </div>
      </div>
      
      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Page Title for the Catalog View - distinct from the tab name */}
        {isParentView && activeTab === 'catalog' && (
          <h2 className="text-2xl font-bold tracking-tight mb-4">Manage Family Catalog</h2>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            {/* Conditional Tabs for Parent vs Child */}
            {!isParentView && (
              <>
                <TabsTrigger value="my-list">My Wishlist</TabsTrigger>
                <TabsTrigger value="active-goal" disabled={!activeGoal}>Active Goal</TabsTrigger>
              </>
            )}
            <TabsTrigger value="catalog">Family Catalog</TabsTrigger>
          </TabsList>

          {/* My Wishlist Tab - Only for Children or Parent viewing as Child */}
          {!isParentView && (
          <TabsContent value="my-list">
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {activeGoal && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">Current Goal</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <WishlistCard 
                        key={activeGoal.id} 
                        goal={activeGoal} 
                        onSetAsGoal={handleSetAsGoal}
                        onDelete={handleGoalDeleted}
                        refreshList={refetch}
                      />
                    </div>
                  </div>
                )}

                <div className="mb-2">
                  <h3 className="text-lg font-medium">Wishlist Items</h3>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistGoals.length > 0 ? (
                    wishlistGoals.map(goal => (
                      <WishlistCard
                        key={goal.id}
                        goal={goal}
                        onSetAsGoal={handleSetAsGoal}
                        onDelete={handleGoalDeleted}
                        refreshList={refetch}
                      />
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                      <h3 className="text-lg font-medium mb-2">Your Wishlist is Empty</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Browse the Family Catalog to add items to your wishlist
                      </p>
                      <Button onClick={() => setActiveTab("catalog")}>
                        Browse Catalog
                      </Button>
                    </div>
                  )}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
          )}

          <TabsContent value="catalog">
            {/* When parent views catalog, onProductSelected might not be needed, or could have different meaning */}
            {/* For children, onProductSelected adds to their personal wishlist */}
            <SharedCatalog 
              onProductSelected={isParentView ? () => {} : handleAddToWishlist} 
            />
          </TabsContent>

          {/* Active Goal Tab - Only for Children or Parent viewing as Child */}
          {!isParentView && activeGoal && (
          <TabsContent value="active-goal">
            {activeGoal && (
              <div className="grid grid-cols-1 gap-4">
                <WishlistCard 
                  key={activeGoal.id} 
                  goal={activeGoal} 
                  onSetAsGoal={handleSetAsGoal}
                  onDelete={handleGoalDeleted}
                  refreshList={refetch}
                />
                <div className="p-4 border rounded-lg mt-4">
                  <h3 className="text-lg font-semibold mb-2">Detailed Progress</h3>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                      <div 
                        className="bg-primary-600 h-6 rounded-full flex items-center justify-center text-xs text-white"
                        style={{ width: `${activeGoal.progress}%` }}
                      >
                        {activeGoal.progress}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div>Saved: {activeGoal.tickets_saved} tickets</div>
                    <div>Goal: {Math.ceil(activeGoal.product.price_locked_cents / 10)} tickets</div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
