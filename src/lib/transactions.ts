import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Transaction, TransactionType } from "@/lib/types";

const TABLE = "transactions";

const TRANSACTION_COLUMNS =
  "id, amount, type, category, description, date, created_at";

export type TransactionFilter = TransactionType | "all";

function hasSupabaseEnv() {
  return getSupabaseEnv() !== null;
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
  if (error) {
    const err = new Error(
      `Не удалось загрузить транзакции: ${error.message}`,
    );
    (err as Error & { code?: string }).code = error.code;
    throw err;
  }
  return (data ?? []) as Transaction[];
}

export function isMissingTableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as Error & { code?: string }).code;
  if (code === "PGRST205" || code === "42P01") return true;
  return /Could not find the table|relation .* does not exist/i.test(
    err.message,
  );
}

export async function getTransaction(id: number): Promise<Transaction | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(TRANSACTION_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Не удалось загрузить транзакцию #${id}: ${error.message}`);
  return (data as Transaction) ?? null;
}

export type MonthlyTotals = {
  income: number;
  expense: number;
  balance: number;
};

export function calculateMonthlyTotals(
  transactions: Transaction[],
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
    if (t.type === "income") income += Number(t.amount);
    else expense += Number(t.amount);
  }

  return { income, expense, balance: income - expense };
}
