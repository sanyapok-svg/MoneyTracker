import { BalanceSummary } from "@/components/balance-summary";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { DashboardHeader } from "@/components/dashboard-header";
import { ExchangeRatesCard } from "@/components/exchange-rates-card";
import { SetupNotice } from "@/components/setup-notice";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionList } from "@/components/transaction-list";
import { WalletsSummary } from "@/components/wallets-summary";
import { buildRatesMap, parseDisplayCurrency } from "@/lib/currency";
import { getExchangeRatesSnapshot } from "@/lib/exchange-rates";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  calculateMonthlyTotals,
  isLegacyTransactionSchema,
  isMissingTableError,
  listTransactions,
  type TransactionFilter,
} from "@/lib/transactions";
import { listWallets } from "@/lib/wallets";
import type { Transaction } from "@/lib/types";

type SearchParams = Promise<{ type?: string; display?: string }>;

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
  const sp = await searchParams;
  const filter = parseFilter(sp.type);
  const displayCurrency = parseDisplayCurrency(sp.display);

  if (!getSupabaseEnv()) {
    return (
      <Shell>
        <SetupNotice reason="missing-env" />
      </Shell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ratesSnapshot;
  try {
    ratesSnapshot = await getExchangeRatesSnapshot();
  } catch {
    ratesSnapshot = null;
  }

  let transactions: Transaction[] = [];
  let allTransactions: Transaction[] = [];
  let missingTable = false;
  let wallets = user ? await listWallets(user.id) : [];
  const legacySchema = await isLegacyTransactionSchema();

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

  const rates = ratesSnapshot?.rates ?? null;
  const totals =
    rates != null
      ? calculateMonthlyTotals(allTransactions, displayCurrency, rates)
      : calculateMonthlyTotals(allTransactions, "BYN", buildRatesMap([]));

  return (
    <Shell>
      {legacySchema ? (
        <SetupNotice reason="missing-multi-currency" />
      ) : null}

      {!legacySchema ? (
        <div className="grid gap-6 lg:grid-cols-2">
        {ratesSnapshot ? (
          <ExchangeRatesCard
            rates={ratesSnapshot.rates}
            lastUpdated={ratesSnapshot.lastUpdated}
            rateDate={ratesSnapshot.rateDate}
          />
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Курсы НБ РБ временно недоступны. Проверьте подключение к интернету.
          </div>
        )}
        <WalletsSummary wallets={wallets} />
        </div>
      ) : null}

      {!legacySchema && rates != null ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Валюта отображения</p>
              <CurrencySwitcher
                current={displayCurrency}
                filter={filter}
              />
            </div>
          </div>

          <BalanceSummary
            income={totals.income}
            expense={totals.expense}
            displayCurrency={displayCurrency}
          />
        </>
      ) : (
        <BalanceSummary
          income={totals.income}
          expense={totals.expense}
          displayCurrency="BYN"
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <TransactionFilters
          current={filter}
          displayCurrency={displayCurrency}
        />
        <span className="text-sm text-muted-foreground">
          Показано: {transactions.length}
        </span>
      </div>

      <TransactionList
        transactions={transactions}
        displayCurrency={rates != null ? displayCurrency : "BYN"}
        rates={rates ?? buildRatesMap([])}
        wallets={wallets}
      />
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
