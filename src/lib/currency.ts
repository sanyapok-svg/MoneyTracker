export const CURRENCIES = ["BYN", "USD", "EUR", "RUB", "KZT"] as const;

export type Currency = (typeof CURRENCIES)[number];

/** Валюты с курсом НБ РБ (база — BYN) */
export const NBRB_CURRENCIES = ["USD", "EUR", "RUB", "KZT"] as const;

export type NbrbCurrency = (typeof NBRB_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  BYN: "Бел. рубль",
  USD: "Доллар США",
  EUR: "Евро",
  RUB: "Российский рубль",
  KZT: "Тенге",
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function parseDisplayCurrency(value: string | undefined): Currency {
  if (value && isCurrency(value)) return value;
  return "BYN";
}

export type ExchangeRateRow = {
  currency: Currency;
  rate_to_byn: number;
  cur_scale: number;
  cur_official_rate: number;
  rate_date: string;
  updated_at: string;
};

export type RatesMap = Record<Currency, ExchangeRateRow>;

export function buildRatesMap(rows: ExchangeRateRow[]): RatesMap {
  const byn: ExchangeRateRow = {
    currency: "BYN",
    rate_to_byn: 1,
    cur_scale: 1,
    cur_official_rate: 1,
    rate_date: rows[0]?.rate_date ?? new Date().toISOString().slice(0, 10),
    updated_at: rows[0]?.updated_at ?? new Date().toISOString(),
  };

  const map = { BYN: byn } as RatesMap;
  for (const row of rows) {
    if (row.currency !== "BYN") {
      map[row.currency] = row;
    }
  }
  for (const c of CURRENCIES) {
    if (!map[c]) {
      map[c] = { ...byn, currency: c };
    }
  }
  return map;
}

export function toByn(amount: number, currency: Currency, rates: RatesMap): number {
  if (currency === "BYN") return amount;
  return amount * rates[currency].rate_to_byn;
}

export function fromByn(amountByn: number, currency: Currency, rates: RatesMap): number {
  if (currency === "BYN") return amountByn;
  return amountByn / rates[currency].rate_to_byn;
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: RatesMap,
): number {
  if (from === to) return amount;
  return fromByn(toByn(amount, from, rates), to, rates);
}

const MINSK_TZ = "Europe/Minsk";

function getMinskParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MINSK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
}

/** Последний запланированный момент обновления — 09:00 по Минску, не позже now */
export function getLastScheduledRateRefresh(now = new Date()): Date {
  const p = getMinskParts(now);
  let { year, month, day } = p;
  if (p.hour < 9) {
    const prev = new Date(Date.UTC(year, month - 1, day));
    prev.setUTCDate(prev.getUTCDate() - 1);
    year = prev.getUTCFullYear();
    month = prev.getUTCMonth() + 1;
    day = prev.getUTCDate();
  }
  for (let utcHour = 0; utcHour < 48; utcHour++) {
    const test = new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0));
    const tp = getMinskParts(test);
    if (tp.year === year && tp.month === month && tp.day === day && tp.hour === 9) {
      return test;
    }
  }
  return now;
}

export function needsRateRefresh(lastUpdated: string | null, now = new Date()): boolean {
  if (!lastUpdated) return true;
  const last = new Date(lastUpdated);
  if (Number.isNaN(last.getTime())) return true;
  return last < getLastScheduledRateRefresh(now);
}
