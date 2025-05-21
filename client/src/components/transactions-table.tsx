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

export interface TransactionsTableProps {
  userId?: string;
  limit?: number;
}

export default function TransactionsTable({ userId, limit = 10 }: TransactionsTableProps) {
  const { user, isViewingAsChild } = useAuthStore();
  const viewingAsChild = isViewingAsChild();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile } = useMobile();
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const openDeleteDialog = (id: number) => {
    setTransactionToDelete(id);
  };
  
  // If we're viewing as a child, use that user's ID (this is a fallback, as the query client
  // should automatically add userId to the query params for transactions)
  const effectiveUserId = viewingAsChild && user ? user.id.toString() : userId;
  
  const queryUrl = `/api/transactions${effectiveUserId ? `?userId=${effectiveUserId}` : ''}${limit ? `${effectiveUserId ? '&' : '?'}limit=${limit}` : ''}`;
  
  const { data: transactions = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: [queryUrl],
    // Add automatic refetching to ensure we always have fresh data
    refetchInterval: 5000, // Refresh every 5 seconds as a backup
    staleTime: 2000,       // Consider data stale after 2 seconds
  });
  
  // Set up WebSocket listeners for transaction events
  useEffect(() => {
    console.log("Setting up WebSocket listeners in TransactionsTable component");
    
    // Set up individual channel subscriptions for better targeting
    const earnSubscription = subscribeToChannel("transaction:earn", (data) => {
      console.log("TransactionsTable received earn event:", data);
      
      // Always refresh the transaction list when a transaction is earned, regardless of user
      // This helps ensure parent dashboard shows all child transactions
      console.log("TransactionsTable: transaction:earn event - forcing complete refresh");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // First immediate refetch
      queryClient.refetchQueries({ queryKey: [queryUrl], exact: false });
      
      // Force direct refetch of this component's data
      refetch();
      
      // Also do a delayed refetch to ensure all backend processing is complete
      setTimeout(() => {
        console.log("TransactionsTable: executing delayed refetch after transaction:earn");
        refetch();
      }, 300);
    });
    
    const spendSubscription = subscribeToChannel("transaction:spend", (data) => {
      console.log("TransactionsTable received spend event:", data);
      console.log("TransactionsTable: transaction:spend event - forcing complete refresh");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // First immediate refetch
      queryClient.refetchQueries({ queryKey: [queryUrl], exact: false });
      
      // Force direct refetch of this component's data
      refetch();
      
      // Also do a delayed refetch to ensure all backend processing is complete
      setTimeout(() => {
        console.log("TransactionsTable: executing delayed refetch after transaction:spend");
        refetch();
      }, 300);
    });
    
    const deleteSubscription = subscribeToChannel("transaction:delete", (data) => {
      console.log("TransactionsTable received delete event:", data);
      
      // Always refresh transaction list when a transaction is deleted
      console.log("TransactionsTable: transaction:delete event - forcing complete refresh");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // First immediate refetch
      queryClient.refetchQueries({ queryKey: [queryUrl], exact: false });
      
      // Also do an immediate refetch for this specific component
      refetch();
      
      // Force delayed refetches to ensure all backend processing is complete
      setTimeout(() => {
        console.log("TransactionsTable: executing delayed refetch after transaction:delete");
        queryClient.refetchQueries({ queryKey: [queryUrl], exact: false });
        refetch();
      }, 100);
      
      // One more refetch after a longer delay to catch any stragglers
      setTimeout(() => {
        console.log("TransactionsTable: executing final delayed refetch after transaction:delete");
        refetch();
      }, 500);
    });
    
    return () => {
      // Clean up the subscriptions
      if (typeof earnSubscription === 'function') earnSubscription();
      if (typeof spendSubscription === 'function') spendSubscription();
      if (typeof deleteSubscription === 'function') deleteSubscription();
    };
  }, [queryClient, queryUrl]);
  
  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      return await apiRequest(`/api/transactions/${transactionId}`, {
        method: "DELETE"
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully removed.",
      });
      
      // Immediately invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      // Force a direct refetch of transactions with a small delay to allow the WebSocket event to process
      setTimeout(() => {
        console.log("Forcing immediate refetch after transaction deletion");
        // Refetch all transaction queries
        queryClient.refetchQueries({ 
          queryKey: ["/api/transactions"],
          exact: false
        });
        
        // Also trigger a direct refetch for this specific component's data
        refetch();
        
        // And another refetch after a slightly longer delay to ensure backend has completed all processing
        setTimeout(() => {
          refetch();
        }, 300);
      }, 50);
      
      setTransactionToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
      setTransactionToDelete(null);
    },
  });
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  // Get transaction description with more nuance for reward transactions
  const getTransactionDescription = (transaction: any) => {
    if (transaction.note) return transaction.note;

    switch (transaction.type) {
      case 'earn':
        if (transaction.source === 'chore' && transaction.chore)
          return `Completed: ${transaction.chore.name}`;
        if (transaction.source === 'bonus_spin') return 'Bonus Wheel Spin';
        return 'Tickets Earned';
      case 'spend':
        if (transaction.goal?.product)
          return `Purchase: ${transaction.goal.product.title}`;
        return 'Tickets Spent';
      case 'deduct':
        return transaction.reason || 'Tickets Deducted';
      case 'reward':
        if (transaction.source === 'manual_add')
          return transaction.reason || 'Bonus Tickets Awarded';
        if (transaction.source === 'bonus_spin') return 'Bonus Spin Opportunity';
        return 'Tickets Awarded';
      default:
        return 'Transaction';
    }
  };

  const getTransactionStatusInfo = (transaction: any) => {
    if (transaction.delta > 0) {
      if (
        transaction.type === 'reward' ||
        transaction.source === 'manual_add' ||
        transaction.source === 'bonus_spin'
      ) {
        return {
          text: 'Awarded',
          style: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300'
        };
      }
      return {
        text: 'Earned',
        style: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      };
    } else if (transaction.delta < 0) {
      if (transaction.type === 'deduct' || transaction.source === 'manual_deduct') {
        return {
          text: 'Deducted',
          style: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
      }
      return {
        text: 'Spent',
        style: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      };
    }
    return {
      text: 'Neutral',
      style: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
          <Card key={transaction.id} className="p-3 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(transaction.created_at)}
              </span>
              <div className={`flex items-center rounded-md px-2 py-1 ${
                  transaction.delta > 0
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : transaction.delta < 0
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="font-semibold">{transaction.delta > 0 ? `+${transaction.delta}` : transaction.delta}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
              {getTransactionDescription(transaction)}
            </p>
            <div className="flex justify-between items-center">
              <Badge variant="outline" className={`${getTransactionStatusInfo(transaction).style} text-xs`}>
                {getTransactionStatusInfo(transaction).text}
              </Badge>
              {(user?.role === 'parent' || user?.id === transaction.user_id) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-500"
                  onClick={() => openDeleteDialog(transaction.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete transaction</span>
                </Button>
              )}
            </div>
          </Card>
        ))
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">No transactions found</div>
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
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900 dark:text-white">
                      {getTransactionDescription(transaction)}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded-md ${
                        transaction.delta > 0
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : transaction.delta < 0
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <span className="font-semibold">{transaction.delta > 0 ? `+${transaction.delta}` : transaction.delta}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getTransactionStatusInfo(transaction);
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.style}`}>
                            {status.text}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {/* Parent can delete any transaction, children can only undo very recent transactions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(transaction.id)}
                        className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                        title={isViewingAsChild() ? "Undo this transaction" : "Delete this transaction"}
                        // For child users: Allow all transactions to be undone for now
                        disabled={isViewingAsChild() && (
                          !transaction.created_at
                        )}
                        style={isViewingAsChild() && (
                          !transaction.created_at
                        ) ? { display: 'none' } : {}}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500 dark:text-gray-400">
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
      <AlertDialog open={transactionToDelete !== null} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isViewingAsChild() ? "Undo this action?" : "Delete this transaction?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isViewingAsChild()
                ? "This will undo the transaction and adjust your ticket balance. You can only undo recent transactions."
                : "This will delete the transaction and update the ticket balance. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => transactionToDelete && deleteTransactionMutation.mutate(transactionToDelete)}
              className={isViewingAsChild() ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isViewingAsChild() ? "Undo" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
