import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import {
  createWebSocketConnection,
  subscribeToChannel,
} from "@/lib/websocketClient";
import TransactionsTable from "@/components/transactions-table";
import { NewChoreDialog } from "@/components/new-chore-dialog";
import { BadBehaviorDialog } from "@/components/bad-behavior-dialog";
import { GoodBehaviorDialog } from "@/components/good-behavior-dialog";
import AwardTrophyDialog from "@/components/award-trophy-dialog";
import { AddProductDialog } from "@/components/add-product-dialog";
import ChildProfileCard from "@/components/child-profile-card";
import ProfileImageModal from "@/components/profile-image-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PlusIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  ImageIcon,
  Calendar,
  Activity,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart3,
  GiftIcon,
  Settings,
  Users,
  Filter,
  Info,
  CheckCircle2,
  Clock,
  Plus,
  Award,
  MinusCircle,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";

// Helper functions for date calculations
const formatDate = (date: Date) => format(date, "MMM d");
const getWeekDates = () => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 0 });
  const end = endOfWeek(today, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export default function ParentDashboard() {
  const { user, setFamilyUsers, switchChildView, getChildUsers } =
    useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const childUsers = getChildUsers();

  // State for dashboard
  const [childSummaries, setChildSummaries] = useState<
    { id: number; name: string; balance: number }[]
  >([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedChildId, setExpandedChildId] = useState<number | null>(null);
  const [choreCounts, setChoreCounts] = useState({ total: 0, completed: 0 });
  const [viewMode, setViewMode] = useState("grid");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const weekDates = getWeekDates();

  // Function to toggle child card expansion
  const toggleExpandChild = (childId: number) => {
    setExpandedChildId(expandedChildId === childId ? null : childId);
  };

  // Load family users, balances, and dashboard data
  useEffect(() => {
    const loadFamilyUsers = async () => {
      try {
        console.log("Attempting to load family users...");
        const users = await apiRequest("/api/users", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (users && Array.isArray(users)) {
          setFamilyUsers(users);
          console.log("Successfully loaded family users:", users);

          // Only refresh balances once
          const balanceResponse = await apiRequest(
            "/api/transactions/refresh-balances",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            },
          );

          // Load balance data for each child user
          const children = users.filter((u) => u.role === "child");
          const summaries = await Promise.all(
            children.map(async (child) => {
              try {
                // Use the balance data we already have from the single refresh call
                // No need to call refresh-balances again for each child

                // Find the balance for this specific child
                let correctBalance = 0;
                if (balanceResponse && Array.isArray(balanceResponse)) {
                  const userBalance = balanceResponse.find(
                    (item) => item.userId === child.id,
                  );
                  if (userBalance && typeof userBalance.balance === "number") {
                    correctBalance = userBalance.balance;
                  }
                }

                console.log(
                  `Loaded balance for ${child.name} (ID: ${child.id}): ${correctBalance}`,
                );

                return {
                  id: child.id,
                  name: child.name,
                  balance: correctBalance,
                };
              } catch (err) {
                console.error(
                  `Failed to load stats for child ${child.name}:`,
                  err,
                );
                return {
                  id: child.id,
                  name: child.name,
                  balance: 0,
                };
              }
            }),
          );
          setChildSummaries(summaries);

          // Get chore completion stats
          const chores = await apiRequest("/api/chores", {
            method: "GET",
            headers: { "Cache-Control": "no-cache" },
          });

          if (chores && Array.isArray(chores)) {
            const total = chores.length;
            const completed = chores.filter((chore) => chore.completed).length;
            setChoreCounts({ total, completed });
          }
        } else {
          console.error("Unexpected response format for family users:", users);
        }
      } catch (err) {
        console.error("Failed to load family users:", err);
        toast({
          title: "Error loading users",
          description:
            "Could not load family members. Some features may not work correctly.",
          variant: "destructive",
        });
      }
    };

    // Load dashboard data on component mount
    loadFamilyUsers();
  }, [setFamilyUsers, toast]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    console.log("Setting up WebSocket listeners for transaction events");

    // Ensure we have an active WebSocket connection
    createWebSocketConnection();

    // Listen for all transaction events for real-time updates
    const generalTransactionSubscription = subscribeToChannel(
      "transaction:",
      (data) => {
        console.log("Received any transaction event - general handler:", data);

        // Extract the user ID from the transaction data
        const transactionUserId = data.data?.user_id;

        console.log(
          `General transaction handler - Current user ID: ${user?.id}, transaction for user ID: ${transactionUserId}`,
        );

        // Refresh data when we receive transaction updates
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      },
    );

    // Clean up subscriptions on unmount
    return () => {
      console.log("Dashboard WebSocket subscriptions cleaned up");
    };
  }, [user?.id, queryClient]);

  // Fetch data with optimized caching strategies
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    staleTime: 60000, // Consider fresh for 1 minute
    refetchInterval: 180000, // Refresh every 3 minutes instead of every minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const { data: chores = [], isLoading: isChoresLoading } = useQuery<any[]>({
    queryKey: ["/api/chores"],
    staleTime: 120000, // Consider fresh for 2 minutes - chores change less frequently
    refetchInterval: false, // Disabled to prevent infinite loop
    gcTime: 600000, // Keep in cache for 10 minutes
    enabled: false, // Temporarily disabled to prevent API loop
  });

  const { isLoading: isStatsLoading, refetch } = useQuery({
    queryKey: ["/api/stats"],
    staleTime: 60000, // Consider fresh for 1 minute
    refetchInterval: 120000, // Refresh every 2 minutes
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const isLoading = isStatsLoading || isChoresLoading || isTransactionsLoading;

  return (
    <>
      {/* Header with date, welcome message, and system indicators */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Parent Command Center
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
              {!isLoading && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>
                    {choreCounts.completed}/{choreCounts.total} Chores Done
                  </span>
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() =>
                setDisplayMode((prev) => (prev === "grid" ? "list" : "grid"))
              }
            >
              <Filter className="h-4 w-4" />
              {displayMode === "grid" ? "List View" : "Grid View"}
            </Button>

            <Button
              size="sm"
              variant="default"
              className="flex items-center"
              onClick={() => refetch()}
            >
              <Activity className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area with tabs */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="children" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Children</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Actions</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              {/* Quick Management Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <NewChoreDialog onChoreCreated={() => queryClient.invalidateQueries({ queryKey: ["/api/chores"] })}>
                    <Button className="h-20 flex flex-col items-center gap-2 bg-blue-500 hover:bg-blue-600">
                      <PlusIcon className="h-6 w-6" />
                      <span className="text-sm">Add Chore</span>
                    </Button>
                  </NewChoreDialog>
                  
                  <GoodBehaviorDialog>
                    <Button className="h-20 flex flex-col items-center gap-2 bg-green-500 hover:bg-green-600">
                      <Star className="h-6 w-6" />
                      <span className="text-sm">Good Behavior</span>
                    </Button>
                  </GoodBehaviorDialog>
                  
                  <BadBehaviorDialog>
                    <Button className="h-20 flex flex-col items-center gap-2 bg-red-500 hover:bg-red-600">
                      <MinusCircleIcon className="h-6 w-6" />
                      <span className="text-sm">Bad Behavior</span>
                    </Button>
                  </BadBehaviorDialog>
                  
                  <AwardTrophyDialog>
                    <Button className="h-20 flex flex-col items-center gap-2 bg-purple-500 hover:bg-purple-600">
                      <GiftIcon className="h-6 w-6" />
                      <span className="text-sm">Award Trophy</span>
                    </Button>
                  </AwardTrophyDialog>
                </div>
              </div>

              {/* Child Management Cards */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Child Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {childSummaries.length > 0 ? (
                    childSummaries.map((child) => {
                      // Find the full child user object to get additional data like username and profile image
                      const childUser = childUsers.find(
                        (u) => u.id === child.id,
                      );
                      if (!childUser) return null;

                      // Get transactions for this child
                      const childTransactions =
                        transactions && Array.isArray(transactions)
                          ? transactions.filter((t) => t.user_id === child.id)
                          : [];

                      // Check for today's activity
                      const hasActivityToday = childTransactions.some(
                        (t) =>
                          new Date(t.created_at).toDateString() ===
                          new Date().toDateString(),
                      );

                      return (
                        <Collapsible
                          key={child.id}
                          open={expandedChildId === child.id}
                          onOpenChange={() => {}}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="relative">
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200">
                                  {childUser.profile_image_url ? (
                                    <img
                                      src={childUser.profile_image_url}
                                      alt={`${childUser.name}'s profile`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold">
                                      {childUser.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                {hasActivityToday && (
                                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                )}
                              </div>
                              <div className="ml-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {childUser.name}
                                </h4>
                                <div className="flex items-center text-sm">
                                  <span className="text-amber-500 font-medium">
                                    {child.balance} tickets
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-700 dark:text-gray-300"
                                onClick={() => switchChildView(childUser)}
                              >
                                View
                              </Button>

                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleExpandChild(child.id)}
                                >
                                  {expandedChildId === child.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>

                              <button
                                className="bg-white dark:bg-gray-700 rounded-full p-1 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering other actions
                                  setSelectedChild(childUser);
                                  setProfileModalOpen(true);
                                }}
                                aria-label={`Update ${childUser.name}'s profile picture`}
                              >
                                <ImageIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </button>
                            </div>
                          </div>

                          <CollapsibleContent>
                            <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex flex-wrap justify-between mb-3">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Recent Activity
                                  </p>
                                  <p className="text-sm">
                                    {childTransactions.length > 0
                                      ? format(
                                          new Date(
                                            childTransactions[0].created_at,
                                          ),
                                          "MMM d, h:mm a",
                                        )
                                      : "No recent activity"}
                                  </p>
                                </div>

                                <div className="flex gap-1">
                                  <GoodBehaviorDialog initialChildId={child.id}>
                                    <Button
                                      size="sm"
                                      className="text-white bg-green-600 hover:bg-green-700"
                                    >
                                      <PlusCircleIcon className="h-3 w-3 mr-1" />{" "}
                                      Reward
                                    </Button>
                                  </GoodBehaviorDialog>

                                  <BadBehaviorDialog initialChildId={child.id}>
                                    <Button size="sm" variant="destructive">
                                      <MinusCircleIcon className="h-3 w-3 mr-1" />{" "}
                                      Deduct
                                    </Button>
                                  </BadBehaviorDialog>
                                </div>
                              </div>

                              {Array.isArray(chores) && chores.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Today's Chores
                                  </p>
                                  <div className="space-y-1">
                                    {chores
                                      .filter((c) => !c.completed)
                                      .slice(0, 3)
                                      .map((chore) => (
                                        <div
                                          key={chore.id}
                                          className="flex items-center justify-between text-sm"
                                        >
                                          <span className="truncate">
                                            {chore.name}
                                          </span>
                                          <span className="text-amber-600 font-medium">
                                            {chore.base_tickets}
                                          </span>
                                        </div>
                                      ))}
                                    {chores.filter((c) => !c.completed)
                                      .length === 0 && (
                                      <p className="text-sm text-gray-500">
                                        All chores completed!
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })
                  ) : (
                    <div className="col-span-full p-4 text-center text-gray-500 dark:text-gray-400">
                      No child profiles found
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-primary-50 to-white dark:from-gray-700 dark:to-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-primary-600" />
                      Family Economy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                          {childSummaries.reduce(
                            (sum, child) => sum + child.balance,
                            0,
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tickets in circulation
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {
                            // Only count Bryce and Kiki as active children
                            childSummaries.filter(
                              (child) => child.id === 4 || child.id === 5,
                            ).length
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Active children
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-gray-700 dark:to-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                      Chore Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                          {choreCounts.completed}/{choreCounts.total}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Chores completed today
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {choreCounts.total > 0
                            ? Math.round(
                                (choreCounts.completed / choreCounts.total) *
                                  100,
                              )
                            : 0}
                          %
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completion rate
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-gray-700 dark:to-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center">
                      <Star className="h-4 w-4 mr-1 text-amber-600" />
                      Reward Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                          {transactions && Array.isArray(transactions)
                            ? transactions.filter(
                                (t) =>
                                  t.type === "earn" &&
                                  new Date(t.created_at).toDateString() ===
                                    new Date().toDateString(),
                              ).length
                            : 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rewards today
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {transactions && Array.isArray(transactions)
                            ? transactions.filter(
                                (t) =>
                                  t.type === "earn" &&
                                  t.source === "bonus_spin",
                              ).length
                            : 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pending bonuses
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Toolbar */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <Card className="hover:border-primary-300 hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <NewChoreDialog onChoreCreated={refetch}>
                        <Button
                          variant="ghost"
                          className="w-full h-full flex flex-col items-center py-4"
                        >
                          <PlusIcon className="h-6 w-6 mb-2 text-blue-600" />
                          <span className="text-sm">New Chore</span>
                        </Button>
                      </NewChoreDialog>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-primary-300 hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <GoodBehaviorDialog>
                        <Button
                          variant="ghost"
                          className="w-full h-full flex flex-col items-center py-4"
                        >
                          <PlusCircleIcon className="h-6 w-6 mb-2 text-green-600" />
                          <span className="text-sm">Good Behavior</span>
                        </Button>
                      </GoodBehaviorDialog>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-primary-300 hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <BadBehaviorDialog>
                        <Button
                          variant="ghost"
                          className="w-full h-full flex flex-col items-center py-4"
                        >
                          <MinusCircleIcon className="h-6 w-6 mb-2 text-red-600" />
                          <span className="text-sm">Bad Behavior</span>
                        </Button>
                      </BadBehaviorDialog>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-primary-300 hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <AddProductDialog
                        onProductAdded={() =>
                          queryClient.invalidateQueries({
                            queryKey: ["/api/products"],
                          })
                        }
                      >
                        <Button
                          variant="ghost"
                          className="w-full h-full flex flex-col items-center py-4"
                        >
                          <GiftIcon className="h-6 w-6 mb-2 text-purple-600" />
                          <span className="text-sm">Add Product</span>
                        </Button>
                      </AddProductDialog>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Transactions</h3>
                  <a
                    href="/transactions"
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    View All
                  </a>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {isTransactionsLoading ? (
                      <div className="flex justify-center my-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    ) : (
                      <TransactionsTable limit={8} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Children Tab */}
            <TabsContent value="children" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {childSummaries.map((child) => {
                  const childUser = childUsers.find((u) => u.id === child.id);
                  if (!childUser) return null;

                  return (
                    <Card key={child.id} className="overflow-hidden">
                      <div className="h-2 bg-primary-600"></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-200">
                                {childUser.profile_image_url ? (
                                  <img
                                    src={childUser.profile_image_url}
                                    alt={`${childUser.name}'s profile`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold">
                                    {childUser.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <button
                                className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => {
                                  setSelectedChild(childUser);
                                  setProfileModalOpen(true);
                                }}
                                aria-label={`Update ${childUser.name}'s profile`}
                              >
                                <ImageIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                              </button>
                            </div>
                            <div>
                              <CardTitle>{childUser.name}</CardTitle>
                              <CardDescription>
                                {childUser.username}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-amber-500 font-bold text-xl flex items-center">
                              {child.balance}{" "}
                              <span className="text-xs ml-1">tickets</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1"
                              onClick={() => switchChildView(childUser)}
                            >
                              View Dashboard
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <GoodBehaviorDialog initialChildId={child.id}>
                            <Button
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              <PlusCircleIcon className="h-4 w-4 mr-1" /> Reward
                            </Button>
                          </GoodBehaviorDialog>

                          <BadBehaviorDialog initialChildId={child.id}>
                            <Button size="sm" variant="destructive">
                              <MinusCircleIcon className="h-4 w-4 mr-1" />{" "}
                              Deduct
                            </Button>
                          </BadBehaviorDialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Logic to assign a bonus to this child
                              setActiveTab("actions");
                              // Could directly open the bonus wheel dialog here
                            }}
                          >
                            <Star className="h-4 w-4 mr-1 text-amber-500" />{" "}
                            Assign Bonus
                          </Button>
                        </div>

                        {Array.isArray(transactions) && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">
                              Recent Activity
                            </h4>
                            {transactions
                              .filter((t) => t.user_id === child.id)
                              .slice(0, 3)
                              .map((transaction) => (
                                <div
                                  key={transaction.id}
                                  className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded"
                                >
                                  <div className="flex items-center">
                                    {transaction.type === "earn" ? (
                                      <PlusCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                                    ) : (
                                      <MinusCircleIcon className="h-4 w-4 mr-1 text-red-500" />
                                    )}
                                    <span className="truncate max-w-[200px]">
                                      {transaction.note}
                                    </span>
                                  </div>
                                  <div
                                    className={cn(
                                      "font-medium",
                                      transaction.delta > 0
                                        ? "text-green-600"
                                        : "text-red-600",
                                    )}
                                  >
                                    {transaction.delta > 0 ? "+" : ""}
                                    {transaction.delta}
                                  </div>
                                </div>
                              ))}
                            {transactions.filter((t) => t.user_id === child.id)
                              .length === 0 && (
                              <p className="text-sm text-gray-500">
                                No recent activity
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Calendar</CardTitle>
                  <CardDescription>
                    Chore schedule and completion status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {weekDates.map((date, i) => (
                      <div
                        key={i}
                        className={cn(
                          "text-center p-2 rounded-md",
                          isToday(date) &&
                            "bg-primary-50 dark:bg-primary-900 border border-primary-200 dark:border-primary-700",
                        )}
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(date, "EEE")}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isToday(date) &&
                              "text-primary-700 dark:text-primary-300",
                          )}
                        >
                          {format(date, "d")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Scheduled chores */}
                  <div className="space-y-4">
                    {childSummaries.map((child) => {
                      const childUser = childUsers.find(
                        (u) => u.id === child.id,
                      );
                      if (!childUser) return null;

                      // Get chores for this child
                      const childChores =
                        chores && Array.isArray(chores)
                          ? chores.filter((c) => !c.completed).slice(0, 3)
                          : [];

                      if (childChores.length === 0) return null;

                      return (
                        <div key={child.id} className="mb-4">
                          <div className="flex items-center mb-2">
                            <div className="h-6 w-6 rounded-full overflow-hidden mr-2">
                              {childUser.profile_image_url ? (
                                <img
                                  src={childUser.profile_image_url}
                                  alt={`${childUser.name}'s profile`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-primary-100 flex items-center justify-center text-primary-800 text-xs font-bold">
                                  {childUser.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <h4 className="font-medium">{childUser.name}</h4>
                          </div>

                          <div className="space-y-2">
                            {childChores.map((chore) => (
                              <Card key={chore.id} className="p-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                    <span>{chore.name}</span>
                                  </div>
                                  <div className="text-amber-600 font-medium">
                                    {chore.base_tickets} tickets
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {!chores ||
                      !Array.isArray(chores) ||
                      (chores.filter((c) => !c.completed).length === 0 && (
                        <div className="text-center p-4">
                          <p className="text-gray-500">
                            No scheduled chores for this week
                          </p>
                          <NewChoreDialog onChoreCreated={refetch}>
                            <Button className="mt-2">
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Add a new chore
                            </Button>
                          </NewChoreDialog>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="actions" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side - Action buttons */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Parent Actions</CardTitle>
                      <CardDescription>
                        Common tasks and controls
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <NewChoreDialog onChoreCreated={refetch}>
                          <Button className="w-full justify-start">
                            <PlusIcon className="mr-2 h-4 w-4" /> New Chore
                          </Button>
                        </NewChoreDialog>

                        <GoodBehaviorDialog>
                          <Button className="w-full justify-start text-white bg-green-600 hover:bg-green-700">
                            <PlusCircleIcon className="mr-2 h-4 w-4" /> Good
                            Behavior
                          </Button>
                        </GoodBehaviorDialog>

                        <BadBehaviorDialog>
                          <Button
                            className="w-full justify-start"
                            variant="destructive"
                          >
                            <MinusCircleIcon className="mr-2 h-4 w-4" /> Bad
                            Behavior
                          </Button>
                        </BadBehaviorDialog>

                        <AddProductDialog
                          onProductAdded={() =>
                            queryClient.invalidateQueries({
                              queryKey: ["/api/products"],
                            })
                          }
                        >
                          <Button
                            className="w-full justify-start"
                            variant="outline"
                          >
                            <GiftIcon className="mr-2 h-4 w-4" /> Add Product
                          </Button>
                        </AddProductDialog>

                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() =>
                            (window.location.href = "/family-catalog")
                          }
                        >
                          <Settings className="mr-2 h-4 w-4" /> Catalog
                        </Button>

                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() =>
                            (window.location.href = "/transactions")
                          }
                        >
                          <Activity className="mr-2 h-4 w-4" /> Transactions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        Alerts & Reminders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {chores &&
                        Array.isArray(chores) &&
                        chores.filter((c) => !c.completed).length > 0 ? (
                          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                            <div className="flex items-center text-amber-800 dark:text-amber-300">
                              <Info className="h-4 w-4 mr-2" />
                              <p className="text-sm">
                                {chores.filter((c) => !c.completed).length}{" "}
                                chores pending completion
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                            <div className="flex items-center text-green-800 dark:text-green-300">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              <p className="text-sm">All chores completed!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right side - Bonus wheel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Bonus Wheel</CardTitle>
                    <CardDescription>
                      Assign special rewards to children
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* DailyBonusWheel component temporarily disabled */}
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">Bonus wheel feature coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Profile Image Modal */}
      {selectedChild && (
        <ProfileImageModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={selectedChild}
        />
      )}
    </>
  );
}
