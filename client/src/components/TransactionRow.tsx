import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Undo2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  delta: number;
  source: string;
  note?: string;
  created_at: string;
  performed_by_id?: number;
  performed_by?: {
    id: number;
    name: string;
    role: string;
  };
  chore?: {
    name: string;
  };
  goal?: {
    product?: {
      title: string;
    };
  };
  reason?: string;
}

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (transactionId: number) => void;
}

export function TransactionRow({ transaction, onDelete }: TransactionRowProps) {
  const { isViewingAsChild, originalUser } = useAuthStore();
  const viewingAsChild = isViewingAsChild();

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Get transaction description with more nuance for reward transactions
  const getTransactionDescription = (transaction: Transaction) => {
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

  const getTransactionStatusInfo = (transaction: Transaction) => {
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

  // Check if current parent can undo this transaction
  const canUndo = viewingAsChild && 
    originalUser && 
    transaction.performed_by_id === originalUser.id;

  return (
    <TableRow>
      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
        {formatDate(transaction.created_at)}
      </TableCell>
      <TableCell className="text-sm font-medium text-gray-900 dark:text-white">
        <div className="space-y-1">
          <div>{getTransactionDescription(transaction)}</div>
          {/* Show "Performed by" chip when parent is viewing as child */}
          {viewingAsChild && transaction.performed_by && (
            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20">
              Performed by {transaction.performed_by.name}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div
          className={`inline-flex items-center px-2 py-1 rounded-md ${
            transaction.delta > 0
              ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : transaction.delta < 0
                ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          <span className="font-semibold">
            {transaction.delta > 0
              ? `+${transaction.delta}`
              : transaction.delta}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {(() => {
          const status = getTransactionStatusInfo(transaction);
          return (
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.style}`}
            >
              {status.text}
            </span>
          );
        })()}
      </TableCell>
      <TableCell>
        {/* Show undo button only when logged-in parent matches performed_by_id */}
        {canUndo ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transaction.id)}
            className="text-orange-400 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-400"
            title="Undo this transaction"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        ) : !viewingAsChild ? (
          // Only show delete button in parent mode (not when viewing as child)
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transaction.id)}
            className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
            title="Delete this transaction"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}