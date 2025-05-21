import TransactionsTable from "./transactions-table";
import type { TransactionsTableProps } from "./transactions-table";

export default function TransactionsTableDesktop(props: TransactionsTableProps) {
  return (
    <div className="hidden sm:block">
      <TransactionsTable {...props} />
    </div>
  );
}
