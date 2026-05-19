import { BalanceSummary } from "@/components/balance-summary";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { DashboardHeader } from "@/components/dashboard-header";
import { ExchangeRatesCard } from "@/components/exchange-rates-card";
import { WeatherCard } from "@/components/weather-card";
import { SetupNotice } from "@/components/setup-notice";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionList } from "@/components/transaction-list";
import { WalletsSummary } from "@/components/wallets-summary";
import { SubscriptionNotice } from "@/components/subscription-notice";
import { buildRatesMap, resolveDisplayCurrency } from "@/lib/currency";
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
import { isStripeConfigured } from "@/lib/stripe";
import {
  getUserSubscription,
  hasPaidConversionAccess,
  syncCheckoutSession,
} from "@/lib/subscriptions";
import { getMinskWeather } from "@/lib/weather";
import type { Transaction } from "@/lib/types";

type SearchParams = Promise<{
  type?: string;
  display?: string;
  checkout?: string;
  session_id?: string;
}>;

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
  const checkoutStatus =
    sp.checkout === "success"
      ? "success"
      : sp.checkout === "canceled"
        ? "canceled"
        : null;

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

  if (sp.session_id && user && checkoutStatus === "success") {
    try {
      await syncCheckoutSession(sp.session_id, user.id);
    } catch {
      /* webhook догонит позже */
    }
  }

  let subscription = user ? await getUserSubscription(user.id) : null;
  const hasPaidConversion = hasPaidConversionAccess(subscription);
  const displayCurrency = resolveDisplayCurrency(
    sp.display,
    hasPaidConversion,
  );
  const stripeEnabled = isStripeConfigured();

  let ratesSnapshot;
  try {
    ratesSnapshot = await getExchangeRatesSnapshot();
  } catch {
    ratesSnapshot = null;
  }

  let weather = null;
  try {
    weather = await getMinskWeather();
  } catch {
    weather = null;
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

      <SubscriptionNotice checkout={checkoutStatus} />

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {!legacySchema ? (
          ratesSnapshot ? (
            <ExchangeRatesCard
              rates={ratesSnapshot.rates}
              lastUpdated={ratesSnapshot.lastUpdated}
              rateDate={ratesSnapshot.rateDate}
            />
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Курсы НБ РБ временно недоступны. Проверьте подключение к интернету.
            </div>
          )
        ) : null}
        {weather ? (
          <WeatherCard weather={weather} />
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Погода временно недоступна. Проверьте подключение к интернету.
          </div>
        )}
        {!legacySchema ? <WalletsSummary wallets={wallets} /> : null}
      </div>

      {!legacySchema && rates != null ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Валюта отображения</p>
              <CurrencySwitcher
                current={displayCurrency}
                filter={filter}
                hasPaidConversion={hasPaidConversion}
                stripeEnabled={stripeEnabled}
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
