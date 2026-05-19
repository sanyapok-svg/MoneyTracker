import {
  buildRatesMap,
  needsRateRefresh,
  type ExchangeRateRow,
  type RatesMap,
} from "@/lib/currency";
import { fetchNbrbRates } from "@/lib/nbrb";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";

const TABLE = "exchange_rates";

export type ExchangeRatesSnapshot = {
  rates: RatesMap;
  lastUpdated: string | null;
  rateDate: string | null;
};

async function readRatesFromDb(): Promise<ExchangeRateRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("*");
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return [];
    throw new Error(`Курсы: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    currency: row.currency as ExchangeRateRow["currency"],
    rate_to_byn: Number(row.rate_to_byn),
    cur_scale: row.cur_scale,
    cur_official_rate: Number(row.cur_official_rate),
    rate_date: row.rate_date,
    updated_at: row.updated_at,
  }));
}

async function persistRates(rows: ExchangeRateRow[]): Promise<void> {
  if (!getSupabaseServiceRoleKey()) {
    return;
  }
  const admin = createSupabaseServiceRoleClient();
  const { error } = await admin.from(TABLE).upsert(
    rows.map((r) => ({
      currency: r.currency,
      rate_to_byn: r.rate_to_byn,
      cur_scale: r.cur_scale,
      cur_official_rate: r.cur_official_rate,
      rate_date: r.rate_date,
      updated_at: r.updated_at,
    })),
    { onConflict: "currency" },
  );
  if (error) {
    throw new Error(`Сохранение курсов: ${error.message}`);
  }
}

export async function refreshExchangeRatesFromNbrb(): Promise<ExchangeRateRow[]> {
  const rows = await fetchNbrbRates();
  await persistRates(rows);
  return rows;
}

export async function ensureExchangeRatesFresh(): Promise<ExchangeRatesSnapshot> {
  let rows = await readRatesFromDb();
  const lastUpdated =
    rows.length > 0
      ? rows.reduce(
          (max, r) => (r.updated_at > max ? r.updated_at : max),
          rows[0].updated_at,
        )
      : null;

  if (needsRateRefresh(lastUpdated)) {
    try {
      rows = await refreshExchangeRatesFromNbrb();
    } catch {
      if (rows.length === 0) throw new Error("Не удалось загрузить курсы НБ РБ");
    }
  }

  const rates = buildRatesMap(rows);
  const rateDate =
    rows.length > 0
      ? rows.reduce(
          (max, r) => (r.rate_date > max ? r.rate_date : max),
          rows[0].rate_date,
        )
      : null;
  const updated =
    rows.length > 0
      ? rows.reduce(
          (max, r) => (r.updated_at > max ? r.updated_at : max),
          rows[0].updated_at,
        )
      : null;

  return { rates, lastUpdated: updated, rateDate };
}

export async function getExchangeRatesSnapshot(): Promise<ExchangeRatesSnapshot> {
  return ensureExchangeRatesFresh();
}
