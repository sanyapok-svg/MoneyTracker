import type { Currency } from "@/lib/currency";

const CURRENCY_ISO: Record<Currency, string> = {
  BYN: "BYN",
  USD: "USD",
  EUR: "EUR",
  RUB: "RUB",
  KZT: "KZT",
};

export function formatMoney(value: number, currency: Currency): string {
  const fraction = currency === "BYN" || currency === "KZT" ? 2 : 2;
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: CURRENCY_ISO[currency],
      minimumFractionDigits: 0,
      maximumFractionDigits: fraction,
    }).format(value);
  } catch {
    return `${value.toLocaleString("ru-RU")} ${currency}`;
  }
}

/** @deprecated используйте formatMoney(value, "BYN") */
export function formatRub(value: number): string {
  return formatMoney(value, "BYN");
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
