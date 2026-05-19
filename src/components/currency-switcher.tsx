import Link from "next/link";
import { CURRENCIES, CURRENCY_LABELS, type Currency } from "@/lib/currency";
import type { TransactionFilter } from "@/lib/transactions";
import { homeUrl } from "@/lib/urls";

type Props = {
  current: Currency;
  filter: TransactionFilter;
};

export function CurrencySwitcher({ current, filter }: Props) {
  return (
    <nav
      className="flex flex-wrap gap-1 rounded-md border p-0.5"
      aria-label="Валюта отображения"
    >
      {CURRENCIES.map((currency) => {
        const active = currency === current;
        return (
          <Link
            key={currency}
            href={homeUrl({ type: filter, display: currency })}
            scroll={false}
            title={CURRENCY_LABELS[currency]}
            className={
              "rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm " +
              (active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
            aria-current={active ? "true" : undefined}
          >
            {currency}
          </Link>
        );
      })}
    </nav>
  );
}
