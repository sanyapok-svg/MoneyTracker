import {
  convertAmount,
  type Currency,
  type RatesMap,
} from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Transaction, TransactionType } from "@/lib/types";

const TABLE = "transactions";

const TRANSACTION_COLUMNS =
  "id, amount, type, currency, category, description, date, created_at";

const LEGACY_TRANSACTION_COLUMNS =
  "id, amount, type, category, description, date, created_at";

export type TransactionFilter = TransactionType | "all";

function hasSupabaseEnv() {
  return getSupabaseEnv() !== null;
}

export function isMissingCurrencyColumnError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /column transactions\.currency does not exist|column "currency" does not exist/i.test(
    err.message,
  );
}

export function isMissingMultiCurrencySchemaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (isMissingCurrencyColumnError(err)) return true;
  return /exchange_rates|wallets/i.test(err.message) &&
    /does not exist|Could not find the table|PGRST205/i.test(err.message);
}

function mapTransactionRow(
  row: Record<string, unknown>,
  legacy = false,
): Transaction {
  return {
    id: row.id as number,
    amount: Number(row.amount),
    type: row.type as Transaction["type"],
    currency: legacy ? "BYN" : ((row.currency as Currency) ?? "BYN"),
    category: row.category as Transaction["category"],
    description: (row.description as string | null) ?? null,
    date: row.date as string,
    created_at: row.created_at as string,
  };
}

export async function listTransactions(
  filter: TransactionFilter = "all",
): Promise<Transaction[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from(TABLE)
    .select(TRANSACTION_COLUMNS)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("type", filter);
  }

  const { data, error } = await query;

  if (error && isMissingCurrencyColumnError(error)) {
    let legacyQuery = supabase
      .from(TABLE)
      .select(LEGACY_TRANSACTION_COLUMNS)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (filter !== "all") {
      legacyQuery = legacyQuery.eq("type", filter);
    }
    const legacy = await legacyQuery;
    if (legacy.error) {
      const err = new Error(
        `Не удалось загрузить транзакции: ${legacy.error.message}`,
      );
      (err as Error & { code?: string }).code = legacy.error.code;
      throw err;
    }
    return (legacy.data ?? []).map((row) =>
      mapTransactionRow(row as Record<string, unknown>, true),
    );
  }

  if (error) {
    const err = new Error(
      `Не удалось загрузить транзакции: ${error.message}`,
    );
    (err as Error & { code?: string }).code = error.code;
    throw err;
  }

  return (data ?? []).map((row) =>
    mapTransactionRow(row as Record<string, unknown>, false),
  );
}

export function isMissingTableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as Error & { code?: string }).code;
  if (code === "PGRST205" || code === "42P01") return true;
  return /Could not find the table|relation .* does not exist/i.test(
    err.message,
  );
}

/** true, если миграция 0003_multi_currency.sql ещё не применена */
export async function isLegacyTransactionSchema(): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from(TABLE).select("currency").limit(1);
  return Boolean(error && isMissingCurrencyColumnError(error));
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(TRANSACTION_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error && isMissingCurrencyColumnError(error)) {
    const legacy = await supabase
      .from(TABLE)
      .select(LEGACY_TRANSACTION_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (legacy.error) {
      throw new Error(`Не удалось загрузить транзакцию #${id}: ${legacy.error.message}`);
    }
    if (!legacy.data) return null;
    return mapTransactionRow(legacy.data as Record<string, unknown>, true);
  }

  if (error) throw new Error(`Не удалось загрузить транзакцию #${id}: ${error.message}`);
  if (!data) return null;
  return mapTransactionRow(data as Record<string, unknown>, false);
}

export type MonthlyTotals = {
  income: number;
  expense: number;
  balance: number;
};

export function calculateMonthlyTotals(
  transactions: Transaction[],
  displayCurrency: Currency,
  rates: RatesMap,
  reference: Date = new Date(),
): MonthlyTotals {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const cur = (t.currency ?? "BYN") as Currency;
    const converted = convertAmount(Number(t.amount), cur, displayCurrency, rates);
    if (t.type === "income") income += converted;
    else expense += converted;
  }

  return { income, expense, balance: income - expense };
}
