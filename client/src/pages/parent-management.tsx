import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { NewChoreDialog } from "@/components/new-chore-dialog";
import { BadBehaviorDialog } from "@/components/bad-behavior-dialog";
import { GoodBehaviorDialog } from "@/components/good-behavior-dialog";
import AwardTrophyDialog from "@/components/award-trophy-dialog";
import { AddProductDialog } from "@/components/add-product-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusIcon,
  MinusCircleIcon,
  Star,
  GiftIcon,
  Settings,
  Users,
  CheckCircle2,
  Activity,
  BarChart3,
  Calendar,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

function ParentManagement() {
  const { user, getChildUsers, switchChildView } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const childUsers = getChildUsers();

  // State for dashboard
  const [childSummaries, setChildSummaries] = useState<
    { id: number; name: string; balance: number }[]
  >([]);
  const [choreCounts, setChoreCounts] = useState({ total: 0, completed: 0 });
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [trophyDialogOpen, setTrophyDialogOpen] = useState(false);
  const [goodBehaviorDialogOpen, setGoodBehaviorDialogOpen] = useState(false);

  // Load family data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load balance data for each child user
        const children = childUsers.filter((u) => u.role === "child");
        const summaries = await Promise.all(
          children.map(async (child) => {
            try {
              const stats = await apiRequest(`/api/stats?userId=${child.id}`);
              return {
                id: child.id,
                name: child.name,
                balance: stats?.balance || 0,
              };
            } catch (err) {
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
        const chores = await apiRequest("/api/chores");
        if (chores && Array.isArray(chores)) {
          const total = chores.length;
          const completed = chores.filter((chore) => chore.completed).length;
          setChoreCounts({ total, completed });
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };

    loadData();
  }, [childUsers]);

  const { data: chores = [] } = useQuery<any[]>({
    queryKey: ["/api/chores"],
    staleTime: 120000,
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    staleTime: 60000,
  });

  const handleAwardTrophy = (child: any) => {
    setSelectedChild(child);
    setTrophyDialogOpen(true);
  };

  const handleGoodBehaviorSpin = (child: any) => {
    setSelectedChild(child);
    setGoodBehaviorDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Parent Management Dashboard
          </h2>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>
                {choreCounts.completed}/{choreCounts.total} Chores Done
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actions" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Quick Actions
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Children
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Quick Actions Tab */}
          <TabsContent value="actions" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <NewChoreDialog
                onChoreCreated={() =>
                  queryClient.invalidateQueries({ queryKey: ["/api/chores"] })
                }
              >
                <Button className="h-24 flex flex-col items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                  <PlusIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">Add Chore</span>
                </Button>
              </NewChoreDialog>

              <GoodBehaviorDialog>
                <Button className="h-24 flex flex-col items-center gap-2 bg-green-500 hover:bg-green-600 text-white">
                  <Star className="h-8 w-8" />
                  <span className="text-sm font-medium">Good Behavior</span>
                </Button>
              </GoodBehaviorDialog>

              <BadBehaviorDialog>
                <Button className="h-24 flex flex-col items-center gap-2 bg-red-500 hover:bg-red-600 text-white">
                  <MinusCircleIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">Bad Behavior</span>
                </Button>
              </BadBehaviorDialog>

              <AddProductDialog onProductAdded={() => queryClient.invalidateQueries({ queryKey: ["/api/products"] })}>
                <Button className="h-24 flex flex-col items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white">
                  <GiftIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">Add Product</span>
                </Button>
              </AddProductDialog>
            </div>

            {/* Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Today's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions
                      .filter(
                        (t) =>
                          new Date(t.created_at).toDateString() ===
                          new Date().toDateString(),
                      )
                      .slice(0, 5)
                      .map((transaction) => {
                        const child = childUsers.find(
                          (c) => c.id === transaction.user_id,
                        );
                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{child?.name}</span>
                            <span
                              className={
                                transaction.type === "earn"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {transaction.type === "earn" ? "+" : "-"}
                              {transaction.tickets} tickets
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Children:</span>
                      <span className="font-medium">{childUsers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Chores:</span>
                      <span className="font-medium">{chores.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Today:</span>
                      <span className="font-medium text-green-600">
                        {choreCounts.completed}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Children Tab */}
          <TabsContent value="children" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {childSummaries.map((child) => {
                const childUser = childUsers.find((u) => u.id === child.id);
                if (!childUser) return null;

                return (
                  <Card key={child.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
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
                        <div>
                          <h4 className="font-semibold">{childUser.name}</h4>
                          <p className="text-sm text-gray-500">
                            {child.balance} tickets
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => switchChildView(childUser)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Dashboard
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGoodBehaviorSpin(childUser)}
                          className="bg-green-500 hover:bg-green-600"
                          title="Award Good Behavior Bonus"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAwardTrophy(childUser)}
                          className="bg-purple-500 hover:bg-purple-600"
                          title="Award Trophy"
                        >
                          <GiftIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {childSummaries.reduce((sum, child) => sum + child.balance, 0)}
                  </div>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{chores.length}</div>
                  <p className="text-sm text-gray-500">Active Chores</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {choreCounts.completed}
                  </div>
                  <p className="text-sm text-gray-500">Completed Today</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{childUsers.length}</div>
                  <p className="text-sm text-gray-500">Children</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Trophy Dialog */}
      {selectedChild && (
        <AwardTrophyDialog
          isOpen={trophyDialogOpen}
          onClose={() => {
            setTrophyDialogOpen(false);
            setSelectedChild(null);
          }}
          childId={selectedChild.id}
          childName={selectedChild.name}
          itemId={0}
          itemTitle="Custom Trophy"
        />
      )}

      {/* Good Behavior Dialog */}
      <GoodBehaviorDialog
        isOpen={goodBehaviorDialogOpen}
        onClose={() => {
          setGoodBehaviorDialogOpen(false);
          setSelectedChild(null);
        }}
        initialChildId={selectedChild?.id}
        onCompleted={() => {
          setGoodBehaviorDialogOpen(false);
          setSelectedChild(null);
        }}
      />
    </div>
  );
}

export default ParentManagement;