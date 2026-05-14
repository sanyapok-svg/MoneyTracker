import { BalanceSummary } from "@/components/balance-summary";
import { DashboardHeader } from "@/components/dashboard-header";
import { SetupNotice } from "@/components/setup-notice";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionList } from "@/components/transaction-list";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  calculateMonthlyTotals,
  isMissingTableError,
  listTransactions,
  type TransactionFilter,
} from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

type SearchParams = Promise<{ type?: string }>;

const VALID_FILTERS: TransactionFilter[] = ["all", "income", "expense"];

function parseFilter(value: string | undefined): TransactionFilter {
  return (VALID_FILTERS as string[]).includes(value ?? "")
    ? (value as TransactionFilter)
    : "all";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { type } = await searchParams;
  const filter = parseFilter(type);

  if (!getSupabaseEnv()) {
    return (
      <Shell>
        <SetupNotice reason="missing-env" />
      </Shell>
    );
  }

  let transactions: Transaction[] = [];
  let allTransactions: Transaction[] = [];
  let missingTable = false;

  try {
    transactions = await listTransactions(filter);
    allTransactions =
      filter === "all" ? transactions : await listTransactions("all");
  } catch (err) {
    if (isMissingTableError(err)) {
      missingTable = true;
    } else {
      throw err;
    }
  }

  if (missingTable) {
    return (
      <Shell>
        <SetupNotice reason="missing-table" />
      </Shell>
    );
  }

  const totals = calculateMonthlyTotals(allTransactions);

  return (
    <Shell>
      <BalanceSummary income={totals.income} expense={totals.expense} />

      <div className="flex items-center justify-between gap-4">
        <TransactionFilters current={filter} />
        <span className="text-sm text-muted-foreground">
          Показано: {transactions.length}
        </span>
      </div>

      <TransactionList transactions={transactions} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <DashboardHeader />
      {children}
    </main>
  );
}
