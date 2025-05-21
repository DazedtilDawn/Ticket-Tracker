import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
import { createWebSocketConnection, subscribeToChannel } from "@/lib/websocketClient"; // Corrected import
import TransactionsTable from "@/components/transactions-table";
import { NewChoreDialog } from "@/components/new-chore-dialog";
import { BadBehaviorDialog } from "@/components/bad-behavior-dialog";
import { GoodBehaviorDialog } from "@/components/good-behavior-dialog";
import { DailyBonusWheel } from "@/components/daily-bonus-wheel";
import { AddProductDialog } from "@/components/add-product-dialog"; // For adding to catalog
import ChildProfileCard from "@/components/child-profile-card";
import ProfileImageModal from "@/components/profile-image-modal";
import { Button } from "@/components/ui/button";
import { PlusIcon, UserIcon, MinusCircleIcon, PlusCircleIcon, ImageIcon } from "lucide-react";
import { format } from "date-fns";

export default function ParentDashboard() {
  const { user, setFamilyUsers, switchChildView, getChildUsers } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const childUsers = getChildUsers();
  
  // State for child summary data
  const [childSummaries, setChildSummaries] = useState<{id: number, name: string, balance: number}[]>([]);
  
  // State for profile image modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  
  // Load family users for the behavior dialogs and child summaries
  useEffect(() => {
    // Always fetch family users on dashboard load to ensure they're available for the behavior dialogs
    const loadFamilyUsers = async () => {
      try {
        console.log("Attempting to load family users...");
        // Use the apiRequest helper to ensure proper token handling
        const users = await apiRequest('/api/users', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        // Store all users in the auth store so they're available for the behavior dialogs
        if (users && Array.isArray(users)) {
          setFamilyUsers(users);
          console.log("Successfully loaded family users:", users);
          
          // Get all transactions in one call first to ensure latest data
          await apiRequest('/api/transactions/refresh-balances', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          // Load balance data for each child user
          const children = users.filter(u => u.role === 'child');
          const summaries = await Promise.all(
            children.map(async (child) => {
              try {
                // Explicitly bypass cache to get fresh data
                const requestOptions = {
                  method: 'GET',
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                };
                
                // Use the transaction data we already refreshed above
                // Get the latest balance directly from the refresh response
                const balanceResponse = await apiRequest('/api/transactions/refresh-balances', { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                // Find the balance for this specific child
                let correctBalance = 0;
                if (balanceResponse && Array.isArray(balanceResponse)) {
                  const userBalance = balanceResponse.find(item => item.userId === child.id);
                  if (userBalance && typeof userBalance.balance === 'number') {
                    correctBalance = userBalance.balance;
                  }
                }
                
                console.log(`Loaded balance for ${child.name} (ID: ${child.id}): ${correctBalance}`);
                
                return {
                  id: child.id,
                  name: child.name,
                  balance: correctBalance
                };
              } catch (err) {
                console.error(`Failed to load stats for child ${child.name}:`, err);
                return {
                  id: child.id,
                  name: child.name,
                  balance: 0
                };
              }
            })
          );
          setChildSummaries(summaries);
        } else {
          console.error("Unexpected response format for family users:", users);
        }
      } catch (err) {
        console.error("Failed to load family users:", err);
        toast({
          title: "Error loading users",
          description: "Could not load family members. Some features may not work correctly.",
          variant: "destructive"
        });
      }
    };
    
    // Load users immediately on component mount
    loadFamilyUsers();
  }, [setFamilyUsers, toast]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    console.log("Setting up WebSocket listeners for transaction events");
    
    // Ensure we have an active WebSocket connection
    createWebSocketConnection();
    
    // Global handler for ALL transaction events to ensure nothing is missed
    const generalTransactionSubscription = subscribeToChannel("transaction:", (data) => {
      console.log("Received any transaction event - general handler:", data);
      
      // Extract the user ID from the transaction data
      const transactionUserId = data.data?.user_id;
      
      console.log(`General transaction handler - Current user ID: ${user?.id}, transaction for user ID: ${transactionUserId}`);
      
      // Refresh data when we receive transaction updates
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    });
    
    // Clean up subscriptions on unmount
    return () => {
      console.log("Dashboard WebSocket subscriptions cleaned up");
    };
  }, [user?.id, queryClient]);
  
  // Fetch transaction data
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    refetchInterval: 60000, // Refresh every minute
  });
  
  const { isLoading, refetch } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 60000, // Refresh every minute
  });
  
  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Parent Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <NewChoreDialog onChoreCreated={refetch}>
              <Button className="inline-flex items-center">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Chore
              </Button>
            </NewChoreDialog>
          </div>
        </div>
      </div>
      
      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Child Selection and Parent Actions */}
            <section className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-0">Parent Controls</h3>
                    <div className="flex flex-wrap gap-3">
                      <BadBehaviorDialog>
                        <Button size="lg" className="text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 shadow-md">
                          <MinusCircleIcon className="w-5 h-5 mr-2" /> Bad Behavior
                        </Button>
                      </BadBehaviorDialog>
                      <GoodBehaviorDialog>
                        <Button size="lg" className="text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 shadow-md">
                          <PlusCircleIcon className="w-5 h-5 mr-2" /> Good Behavior
                        </Button>
                      </GoodBehaviorDialog>
                    </div>
                  </div>
                  
                  {/* Child Profile Cards */}
                  <div className="mb-2">
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Child Profiles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {childSummaries.length > 0 ? (
                        childSummaries.map((child) => {
                          // Find the full child user object to get additional data like username and profile image
                          const childUser = childUsers.find(u => u.id === child.id);
                          if (!childUser) return null;
                          
                          return (
                            <div key={child.id} className="relative">
                              <ChildProfileCard
                                child={childUser}
                                balance={child.balance}
                                onSelectChild={() => {
                                  switchChildView(childUser);
                                }}
                                isParentView={false}
                              />
                              <button 
                                className="absolute top-3 right-3 bg-white dark:bg-gray-700 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the card click
                                  setSelectedChild(childUser);
                                  setProfileModalOpen(true);
                                }}
                                aria-label={`Update ${childUser.name}'s profile picture`}
                              >
                                <ImageIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full p-4 text-center text-gray-500 dark:text-gray-400">
                          No child profiles found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Profile Image Modal */}
            {selectedChild && (
              <ProfileImageModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                user={selectedChild}
              />
            )}

            {/* Family Catalog Quick Actions Section */}
            <section className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Family Catalog</h3>
                  <div className="flex flex-wrap gap-3">
                    <AddProductDialog onProductAdded={() => queryClient.invalidateQueries({ queryKey: ["/api/products"] })}>
                      <Button variant="outline">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add New Product to Catalog
                      </Button>
                    </AddProductDialog>
                    <Button 
                      variant="default" 
                      onClick={() => window.location.href = '/family-catalog'} // Simple navigation
                    >
                      View & Manage Full Catalog
                    </Button>
                  </div>
                  {/* Optional: Display a few recent/highlighted catalog items here later */}
                </div>
              </div>
            </section>

            {/* Daily Bonus Wheel Management */}
            <section className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bonus Management</h3>
                  <DailyBonusWheel />
                </div>
              </div>
            </section>
            
            {/* Recent Transactions */}
            <section className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                    <a href="/transactions" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                      View All
                    </a>
                  </div>
                    {isTransactionsLoading ? (
                      <div className="flex justify-center my-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    ) : (
                      <TransactionsTable limit={10} />
                    )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
