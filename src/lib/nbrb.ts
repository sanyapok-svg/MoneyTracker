import { NBRB_CURRENCIES, type Currency, type ExchangeRateRow } from "@/lib/currency";

const NBRB_RATES_URL =
  "https://api.nbrb.by/exrates/rates?periodicity=0&parammode=2";

export type NbrbRateResponse = {
  Cur_Abbreviation: string;
  Cur_Scale: number;
  Cur_OfficialRate: number;
  Date: string;
};

export async function fetchNbrbRates(): Promise<ExchangeRateRow[]> {
  const res = await fetch(NBRB_RATES_URL, {
    next: { revalidate: 0 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`НБ РБ: HTTP ${res.status}`);
  }

  const data = (await res.json()) as NbrbRateResponse[];
  const wanted = new Set<string>(NBRB_CURRENCIES);
  const now = new Date().toISOString();
  const rows: ExchangeRateRow[] = [];

  for (const item of data) {
    if (!wanted.has(item.Cur_Abbreviation)) continue;
    const scale = item.Cur_Scale > 0 ? item.Cur_Scale : 1;
    const rate = item.Cur_OfficialRate / scale;
    rows.push({
      currency: item.Cur_Abbreviation as Currency,
      rate_to_byn: rate,
      cur_scale: scale,
      cur_official_rate: item.Cur_OfficialRate,
      rate_date: item.Date.slice(0, 10),
      updated_at: now,
    });
  }

  const missing = NBRB_CURRENCIES.filter(
    (c) => !rows.some((r) => r.currency === c),
  );
  if (missing.length > 0) {
    throw new Error(`НБ РБ: нет курсов для ${missing.join(", ")}`);
  }

  return rows;
}
