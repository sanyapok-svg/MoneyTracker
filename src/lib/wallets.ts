import { CURRENCIES, type Currency } from "@/lib/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TABLE = "wallets";

export type Wallet = {
  id: number;
  user_id: string;
  currency: Currency;
  balance: number;
};

export async function ensureUserWallets(userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const rows = CURRENCIES.map((currency) => ({
    user_id: userId,
    currency,
    balance: 0,
  }));
  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: "user_id,currency", ignoreDuplicates: true });
  if (error && error.code !== "42P01" && error.code !== "PGRST205") {
    throw new Error(`Кошельки: ${error.message}`);
  }
}

export async function listWallets(userId: string): Promise<Wallet[]> {
  await ensureUserWallets(userId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, currency, balance")
    .eq("user_id", userId)
    .order("currency");

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return [];
    throw new Error(`Кошельки: ${error.message}`);
  }

  return (data ?? []).map((w) => ({
    id: w.id,
    user_id: w.user_id,
    currency: w.currency as Currency,
    balance: Number(w.balance),
  }));
}

export function walletsByCurrency(wallets: Wallet[]): Record<Currency, Wallet> {
  const map = {} as Record<Currency, Wallet>;
  for (const w of wallets) {
    map[w.currency] = w;
  }
  return map;
}
