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
import { 
  PlusIcon, 
  ShoppingBag, 
  Gift, 
  Ticket, 
  Heart, 
  Star, 
  TrendingUp, 
  Sparkles
} from "lucide-react";
import { TICKET_CENT_VALUE } from "../../../config/business";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function FamilyCatalogPage() {
  const { user, isViewingAsChild, getChildUsers } = useAuthStore();
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Default tab logic based on role
  const isParentView = user?.role === 'parent' && !isViewingAsChild();
  const [activeTab, setActiveTab] = useState(isParentView ? "catalog" : "my-list");
  
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
        description: "The item has been added to your wishlist.",
        duration: 3000,
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
  
  // Calculate estimated days to completion
  const getEstimatedCompletion = (goal: any) => {
    if (!goal || !goal.tickets_saved) return "Unknown";
    
    const totalTicketsNeeded = Math.ceil(goal.product.price_locked_cents / TICKET_CENT_VALUE);
    const ticketsRemaining = totalTicketsNeeded - goal.tickets_saved;
    
    // Calculate based on recent earning rate
    // This is a placeholder - a real implementation would look at the user's recent
    // ticket earning history to make a smarter prediction
    const estimatedTicketsPerDay = 3; // Assume 3 tickets per day average
    const daysRemaining = Math.ceil(ticketsRemaining / estimatedTicketsPerDay);
    
    if (daysRemaining <= 0) return "Ready now!";
    if (daysRemaining === 1) return "1 day";
    if (daysRemaining < 7) return `${daysRemaining} days`;
    if (daysRemaining < 30) return `${Math.ceil(daysRemaining / 7)} weeks`;
    return `${Math.ceil(daysRemaining / 30)} months`;
  };
  
  return (
    <>
      {/* Enhanced header with gradient background */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950/30 dark:to-purple-950/20 shadow-sm">
        <div className="px-4 py-6 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 flex items-center">
              {activeTab === "catalog" ? (
                <>
                  <Gift className="mr-3 h-6 w-6 text-primary-600" />
                  {isParentView ? "Family Catalog" : "Wishlist Catalog"}
                </>
              ) : activeTab === "active-goal" ? (
                <>
                  <Star className="mr-3 h-6 w-6 text-amber-500" />
                  My Active Goal
                </>
              ) : (
                <>
                  <Heart className="mr-3 h-6 w-6 text-pink-500" />
                  My Wishlist
                </>
              )}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {activeTab === "catalog" 
                ? "Discover amazing items for your wishlist!"
                : activeTab === "active-goal" 
                ? "Track your progress toward your current goal"
                : "Items you're saving tickets for"}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="mt-4 sm:mt-0 flex gap-2">
            {!isParentView && (
              <AddProductDialog onProductAdded={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                refetch();
              }}>
                <Button className="inline-flex items-center">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </AddProductDialog>
            )}
          </div>
        </div>
      </div>
      
      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 rounded-lg">
            {/* Conditional Tabs for Parent vs Child */}
            {!isParentView && (
              <>
                <TabsTrigger 
                  value="my-list" 
                  className="flex items-center data-[state=active]:bg-primary-50 dark:data-[state=active]:bg-primary-900/30"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  My Wishlist
                </TabsTrigger>
                <TabsTrigger 
                  value="active-goal" 
                  disabled={!activeGoal}
                  className="flex items-center data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-900/30"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Active Goal
                </TabsTrigger>
              </>
            )}
            <TabsTrigger 
              value="catalog"
              className="flex items-center data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30"
            >
              <Gift className="mr-2 h-4 w-4" />
              Family Catalog
            </TabsTrigger>
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <Star className="mr-2 h-5 w-5 text-amber-500" />
                        Current Goal
                      </h3>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
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

                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center">
                      <Heart className="mr-2 h-5 w-5 text-pink-500" />
                      Wishlist Items
                    </h3>
                    {wishlistGoals.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {wishlistGoals.length} item{wishlistGoals.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {wishlistGoals.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {wishlistGoals.map(goal => (
                        <WishlistCard
                          key={goal.id}
                          goal={goal}
                          onSetAsGoal={handleSetAsGoal}
                          onDelete={handleGoalDeleted}
                          refreshList={refetch}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-12 text-center border rounded-lg bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/30">
                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <ShoppingBag className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-medium mb-2 text-slate-700 dark:text-slate-200">Your Wishlist is Empty</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                      Browse the Family Catalog to discover amazing items and add them to your wishlist!
                    </p>
                    <Button 
                      onClick={() => setActiveTab("catalog")}
                      size="lg"
                      className="bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600"
                    >
                      <Gift className="mr-2 h-5 w-5" />
                      Browse Catalog
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          )}

          <TabsContent value="catalog">
            {/* For children, onProductSelected adds to their personal wishlist */}
            <SharedCatalog 
              onProductSelected={isParentView ? () => {} : handleAddToWishlist} 
            />
          </TabsContent>

          {/* Enhanced Active Goal Tab with more detailed tracking */}
          {!isParentView && activeGoal && (
          <TabsContent value="active-goal">
            {activeGoal && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card className="overflow-hidden h-full">
                    <div className="h-56 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 flex items-center justify-center">
                      <img
                        src={activeGoal.product.image_url || "https://placehold.co/500x300/e5e7eb/a1a1aa?text=No+Image"}
                        alt={activeGoal.product.title}
                        className="h-full max-w-full object-contain p-4"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <h3 className="text-xl font-bold">{activeGoal.product.title}</h3>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                          ${(activeGoal.product.price_locked_cents / 100).toFixed(2)}
                        </Badge>
                        <div className="flex items-center">
                          <Ticket className="h-4 w-4 text-amber-500 mr-1" />
                          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            {Math.ceil(activeGoal.product.price_locked_cents / TICKET_CENT_VALUE)} tickets
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {activeGoal.product.asin && !activeGoal.product.asin.startsWith('MANUAL') && (
                        <Button variant="link" size="sm" className="px-0 text-blue-600" asChild>
                          <a href={`https://www.amazon.com/dp/${activeGoal.product.asin}`} target="_blank" rel="noopener noreferrer">
                            View on Amazon
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <h3 className="text-xl font-bold flex items-center">
                        <Star className="mr-2 h-5 w-5 text-amber-500" />
                        Goal Progress
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Progress bar with animation */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Current progress</span>
                          <span className="text-primary-600 dark:text-primary-400">{Math.floor(activeGoal.progress)}%</span>
                        </div>
                        <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${activeGoal.progress}%` }}
                          >
                            {activeGoal.progress >= 8 && `${Math.floor(activeGoal.progress)}%`}
                          </div>
                          
                          {/* Milestone markers */}
                          <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center">
                            {[25, 50, 75].map(milestone => (
                              <div 
                                key={milestone}
                                className={`absolute ${activeGoal.progress >= milestone ? 'text-white' : 'text-slate-500'}`}
                                style={{ left: `${milestone}%` }}
                              >
                                <div className="absolute -translate-x-1/2 -translate-y-6 w-px h-2 bg-slate-300 dark:bg-slate-600"></div>
                                <div className="absolute -translate-x-1/2 -translate-y-10 text-[10px] whitespace-nowrap">
                                  {milestone}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats displays */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                          <CardContent className="p-3 text-center">
                            <div className="text-sm text-green-700 dark:text-green-400 font-medium">Saved</div>
                            <div className="text-2xl font-bold text-green-800 dark:text-green-300 mt-1 flex items-center justify-center">
                              <Ticket className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                              {activeGoal.tickets_saved}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
                          <CardContent className="p-3 text-center">
                            <div className="text-sm text-amber-700 dark:text-amber-400 font-medium">Needed</div>
                            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1 flex items-center justify-center">
                              <Ticket className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                              {Math.ceil(activeGoal.product.price_locked_cents / TICKET_CENT_VALUE)}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
                          <CardContent className="p-3 text-center">
                            <div className="text-sm text-purple-700 dark:text-purple-400 font-medium">Remaining</div>
                            <div className="text-2xl font-bold text-purple-800 dark:text-purple-300 mt-1 flex items-center justify-center">
                              <Ticket className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                              {Math.max(0, Math.ceil(activeGoal.product.price_locked_cents / TICKET_CENT_VALUE) - activeGoal.tickets_saved)}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                          <CardContent className="p-3 text-center">
                            <div className="text-sm text-blue-700 dark:text-blue-400 font-medium">Est. Time</div>
                            <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1 flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                              {getEstimatedCompletion(activeGoal)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Encouragement message */}
                      <div className="mt-4 p-4 border border-primary-100 dark:border-primary-800 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                        <h4 className="font-medium text-primary-800 dark:text-primary-300 mb-1">You're doing great!</h4>
                        <p className="text-sm text-primary-700 dark:text-primary-400">
                          {activeGoal.progress < 25 ? (
                            "Keep earning tickets to progress toward your goal. You're just getting started!"
                          ) : activeGoal.progress < 50 ? (
                            "You're making steady progress! Keep going and you'll reach your next milestone soon."
                          ) : activeGoal.progress < 75 ? (
                            "Halfway there! You're making excellent progress toward your goal."
                          ) : activeGoal.progress < 100 ? (
                            "You're getting so close! Just a little more effort and you'll reach your goal."
                          ) : (
                            "Congratulations! You've saved enough tickets to get your item!"
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
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
