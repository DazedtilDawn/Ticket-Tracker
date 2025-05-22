import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, type UserInfo } from "@/store/auth-store";
import { useStatsStore } from "@/store/stats-store";
import { subscribeToChannel } from "@/lib/websocketClient";
import TransactionsMobile from "@/components/transactions-mobile";
import TransactionsTableDesktop from "@/components/transactions-table-desktop";
import { useMediaQuery } from "@/hooks/use-media-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const { user } = useAuthStore();
  const { balance, updateBalance } = useStatsStore();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const isParent = user?.role === "parent";
  const isDesktop = useMediaQuery('(min-width: 640px)');
  
  // Fetch users if current user is a parent
  const { data: users = [] } = useQuery<UserInfo[]>({
    queryKey: ["/api/users"],
    enabled: isParent,
  });
  
  // Fetch user balance with longer caching times
  const { data: stats } = useQuery<{ balance: number }>({
    queryKey: ["/api/stats", userId || "self"],
    staleTime: 60000,    // Consider fresh for 1 minute
    refetchInterval: 120000, // Only poll every 2 minutes
  });
  
  // Update the stats store whenever the stats data changes
  useEffect(() => {
    if (stats && stats.balance !== undefined) {
      console.log("Updating stats store from transactions page:", stats.balance);
      updateBalance(stats.balance);
    }
  }, [stats, updateBalance]);
  
  // Set up WebSocket listeners for transaction events
  const queryClient = useQueryClient();
  useEffect(() => {
    console.log("Setting up WebSocket listeners for transaction events on transactions page");
    
    // Debounce function to prevent multiple refetches in quick succession
    let refetchTimeoutId: NodeJS.Timeout | null = null;
    
    const debouncedRefetch = () => {
      // Clear any existing timeout
      if (refetchTimeoutId) {
        clearTimeout(refetchTimeoutId);
      }
      
      // Set a new timeout
      refetchTimeoutId = setTimeout(() => {
        // Only invalidate queries once - don't force an immediate refetch
        // as the new global debouncing in websocketClient.ts will handle this
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        refetchTimeoutId = null;
      }, 300);
    };
    
    // Set up a connection to listen for all transaction types
    const transactionSubscription = subscribeToChannel("transaction:", (data) => {
      console.log("Received any transaction event on transactions page:", data);
      
      // Check if this transaction is for the currently viewed user
      const transactionUserId = data?.data?.user_id;
      const currentViewingId = userId ? parseInt(userId) : user?.id;
      
      if (transactionUserId && currentViewingId && transactionUserId === currentViewingId) {
        console.log("Transaction is for the current user view, scheduling debounced refresh");
        // Schedule a single debounced refresh
        debouncedRefetch();
      }
    });
    
    return () => {
      // Clean up subscriptions and any pending timeout when component unmounts
      if (refetchTimeoutId) {
        clearTimeout(refetchTimeoutId);
      }
      if (typeof transactionSubscription === 'function') {
        transactionSubscription();
      }
      console.log("Transaction page WebSocket subscriptions cleaned up");
    };
  }, [queryClient, userId, user]);
  
  // Fetch transactions for chart data preparation
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", userId ? `?userId=${userId}&limit=30` : "?limit=30"],
  });
  
  // Prepare chart data
  const chartData = transactions ? prepareChartData(transactions) : [];

  function prepareChartData(transactions: Transaction[]) {
    // Group transactions by date
    const byDate = transactions.reduce((acc: any, txn: Transaction) => {
      const date = new Date(txn.created_at || new Date()).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { date, earned: 0, spent: 0 };
      }
      
      if (txn.delta > 0) {
        acc[date].earned += txn.delta;
      } else {
        acc[date].spent += Math.abs(txn.delta);
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(byDate).sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
  
  const handleUserChange = (value: string) => {
    setUserId(value !== user?.id.toString() ? value : undefined);
  };
  
  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Transactions</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View your earned and spent tickets
            </p>
          </div>
          
          {isParent && users && (
            <div className="mt-4 sm:mt-0 min-w-[200px]">
              <Select 
                value={userId || (user?.id?.toString() || "1")} 
                onValueChange={handleUserChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {user && <SelectItem value={user.id.toString()}>Me ({user.name})</SelectItem>}
                  {users.filter(u => user && u.id !== user.id).map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      
      {/* Content container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Balance Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Balance Summary</CardTitle>
            <CardDescription>
              Current ticket balance: <span className="font-semibold text-primary-600">{balance || stats?.balance || 0} tickets</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value} tickets`, name === 'earned' ? 'Earned' : 'Spent']}
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="earned" 
                      name="Tickets Earned" 
                      stroke="#4f46e5" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spent" 
                      name="Tickets Spent" 
                      stroke="#ef4444" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">No transaction data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              View all your recent transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDesktop ? (
              <TransactionsTableDesktop userId={userId} limit={25} />
            ) : (
              <TransactionsMobile userId={userId} limit={25} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
