import Link from "next/link";
import type { TransactionFilter } from "@/lib/transactions";

const OPTIONS: { value: TransactionFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "income", label: "Доходы" },
  { value: "expense", label: "Расходы" },
];

export function TransactionFilters({ current }: { current: TransactionFilter }) {
  return (
    <nav className="inline-flex rounded-md border p-0.5" aria-label="Фильтры">
      {OPTIONS.map(({ value, label }) => {
        const active = value === current;
        const href = value === "all" ? "/" : `/?type=${value}`;
        return (
          <Link
            key={value}
            href={href}
            scroll={false}
            className={
              "rounded-sm px-3 py-1.5 text-sm transition-colors " +
              (active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
