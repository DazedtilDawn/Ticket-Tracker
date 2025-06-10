import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/context/MobileContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { subscribeToChannel } from "@/lib/websocketClient";
import { useLocation } from "wouter";
import { TransactionRow } from "@/components/TransactionRow";
import { TransactionCard } from "@/components/TransactionCard";

export interface TransactionsTableProps {
  userId?: string;
  limit?: number;
}

export default function TransactionsTable({
  userId,
  limit = 10,
}: TransactionsTableProps) {
  const { user, isViewingAsChild } = useAuthStore();
  const viewingAsChild = isViewingAsChild();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile } = useMobile();
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(
    null,
  );
  const [, navigate] = useLocation();

  const openDeleteDialog = (id: number) => {
    setTransactionToDelete(id);
  };

  // If we're viewing as a child, use that user's ID (this is a fallback, as the query client
  // should automatically add userId to the query params for transactions)
  const effectiveUserId = viewingAsChild && user ? user.id.toString() : userId;

  const queryUrl = `/api/transactions${effectiveUserId ? `?userId=${effectiveUserId}` : ""}${limit ? `${effectiveUserId ? "&" : "?"}limit=${limit}` : ""}`;

  // Use a consistent query key to allow React Query to deduplicate requests
  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useQuery<any[]>({
    queryKey: ["/api/transactions", effectiveUserId || "all", limit], // Structured query key for better cache control
    // Rely on WebSocket events, no polling
    refetchInterval: false, // Disable automatic polling completely
    staleTime: 120000, // Stay fresh for 2 minutes
    gcTime: 300000, // Keep in cache for 5 minutes
    // Cached data loading with optimized fetching
    queryFn: async () => {
      console.log(
        `[OPTIMIZED] Loading transactions from cache or API: ${queryUrl}`,
      );

      try {
        // Check session storage cache first
        const cacheKey = `transactions_${effectiveUserId || "all"}_${limit}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTime = sessionStorage.getItem(`${cacheKey}_time`);

        // If we have cached data less than 30 seconds old, use it
        if (cachedData && cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age < 30000) {
            // 30 seconds
            console.log(`[CACHE HIT] Using cached transactions, age: ${age}ms`);
            return JSON.parse(cachedData);
          }
        }

        // Cache miss or stale, fetch fresh data
        // Use the proper auth token from our auth store
        const authStore = JSON.parse(
          localStorage.getItem("ticket-tracker-auth") || "{}",
        );
        const token = authStore?.state?.token;

        const response = await fetch(queryUrl, {
          credentials: "include",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Cache the fresh data
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());

        return data;
      } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
    },
  });

  // Set up WebSocket listeners for transaction events - using a debounced approach
  useEffect(() => {
    console.log(
      "Setting up WebSocket listeners in TransactionsTable component",
    );

    // Debounce function to prevent multiple refetches in quick succession
    let refetchTimeoutId: NodeJS.Timeout | null = null;

    const debouncedRefetch = () => {
      // Clear any existing timeout
      if (refetchTimeoutId) {
        clearTimeout(refetchTimeoutId);
      }

      // Set a new timeout
      refetchTimeoutId = setTimeout(() => {
        refetch();
        refetchTimeoutId = null;
      }, 300);
    };

    // Simple change handler that works for all transaction events
    const handleTransactionChange = (eventType: string, data: any) => {
      console.log(`TransactionsTable received ${eventType} event:`, data);

      // Just invalidate the queries once - TanStack Query will handle deduplication
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

      // Schedule a single debounced refetch
      debouncedRefetch();
    };

    // Set up consolidated event handlers for all transaction types
    const earnSubscription = subscribeToChannel("transaction:earn", (data) =>
      handleTransactionChange("earn", data),
    );

    const spendSubscription = subscribeToChannel("transaction:spend", (data) =>
      handleTransactionChange("spend", data),
    );

    const deleteSubscription = subscribeToChannel(
      "transaction:delete",
      (data) => handleTransactionChange("delete", data),
    );

    return () => {
      // Clean up the subscriptions and any pending timeout
      if (refetchTimeoutId) {
        clearTimeout(refetchTimeoutId);
      }
      if (typeof earnSubscription === "function") earnSubscription();
      if (typeof spendSubscription === "function") spendSubscription();
      if (typeof deleteSubscription === "function") deleteSubscription();
    };
  }, [queryClient, queryUrl]);

  // Delete transaction mutation with optimistic updates
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      return await apiRequest(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });
    },
    onMutate: async (transactionId: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [queryUrl] });
      
      // Optimistically remove the transaction from the cache
      queryClient.setQueryData([queryUrl], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((t: any) => t.id !== transactionId)
        };
      });
      
      // Close dialog immediately for better UX
      setTransactionToDelete(null);
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully removed.",
      });

      // Only invalidate stats query - transactions are already updated optimistically
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error, transactionId) => {
      console.error("Error deleting transaction:", error);
      
      // Revert the optimistic update
      queryClient.invalidateQueries({ queryKey: [queryUrl] });
      
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
      setTransactionToDelete(null);
    },
  });

  // Format date to readable format (used by mobile layout)
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Get transaction description with more nuance for reward transactions (used by mobile layout)
  const getTransactionDescription = (transaction: any) => {
    if (transaction.note) return transaction.note;

    switch (transaction.type) {
      case "earn":
        if (transaction.source === "chore" && transaction.chore)
          return `Completed: ${transaction.chore.name}`;
        if (transaction.source === "bonus_spin") return "Bonus Wheel Spin";
        return "Tickets Earned";
      case "spend":
        if (transaction.goal?.product)
          return `Purchase: ${transaction.goal.product.title}`;
        return "Tickets Spent";
      case "deduct":
        return transaction.reason || "Tickets Deducted";
      case "reward":
        if (transaction.source === "manual_add")
          return transaction.reason || "Bonus Tickets Awarded";
        if (transaction.source === "bonus_spin")
          return "Bonus Spin Opportunity";
        return "Tickets Awarded";
      default:
        return "Transaction";
    }
  };

  const getTransactionStatusInfo = (transaction: any) => {
    if (transaction.delta > 0) {
      if (
        transaction.type === "reward" ||
        transaction.source === "manual_add" ||
        transaction.source === "bonus_spin"
      ) {
        return {
          text: "Awarded",
          style: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
        };
      }
      return {
        text: "Earned",
        style:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    } else if (transaction.delta < 0) {
      if (
        transaction.type === "deduct" ||
        transaction.source === "manual_deduct"
      ) {
        return {
          text: "Deducted",
          style: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        };
      }
      return {
        text: "Spent",
        style: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    }
    return {
      text: "Neutral",
      style: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
  };

  const mobileLayout = (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="p-3 animate-pulse">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/4" />
          </Card>
        ))
      ) : transactions && transactions.length > 0 ? (
        transactions.map((transaction: any) => (
          <TransactionCard 
            key={transaction.id} 
            transaction={transaction} 
            onDelete={openDeleteDialog} 
          />
        ))
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          No transactions found
        </div>
      )}
    </div>
  );

  const desktopLayout = (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TransactionRow 
                  key={transaction.id} 
                  transaction={transaction} 
                  onDelete={openDeleteDialog} 
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-gray-500 dark:text-gray-400"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? mobileLayout : desktopLayout}
      <AlertDialog
        open={transactionToDelete !== null}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isViewingAsChild()
                ? "Undo this action?"
                : "Delete this transaction?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isViewingAsChild()
                ? "This will undo the transaction and adjust your ticket balance. You can only undo recent transactions."
                : "This will delete the transaction and update the ticket balance. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                transactionToDelete &&
                deleteTransactionMutation.mutate(transactionToDelete)
              }
              className={
                isViewingAsChild()
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isViewingAsChild() ? "Undo" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
