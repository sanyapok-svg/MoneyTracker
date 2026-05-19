import type { Currency } from "@/lib/currency";
import type { TransactionFilter } from "@/lib/transactions";

export function homeUrl(options?: {
  type?: TransactionFilter;
  display?: Currency;
}): string {
  const params = new URLSearchParams();
  if (options?.type && options.type !== "all") {
    params.set("type", options.type);
  }
  if (options?.display && options.display !== "BYN") {
    params.set("display", options.display);
  }
  const q = params.toString();
  return q ? `/?${q}` : "/";
}
