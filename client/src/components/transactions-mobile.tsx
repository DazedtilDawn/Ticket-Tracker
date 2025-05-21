import TransactionsTable from "./transactions-table";
import type { TransactionsTableProps } from "./transactions-table";

export default function TransactionsMobile(props: TransactionsTableProps) {
  return (
    <div className="sm:hidden">
      <TransactionsTable {...props} />
    </div>
  );
}
