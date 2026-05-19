import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Currency } from "@/lib/currency";
import { formatMoney } from "@/lib/format";

type Props = {
  income: number;
  expense: number;
  displayCurrency: Currency;
};

export function BalanceSummary({ income, expense, displayCurrency }: Props) {
  const balance = income - expense;

  return (
    <section
      aria-label="Сводка за месяц"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <SummaryCard
        label={`Доходы за месяц (${displayCurrency})`}
        value={income}
        currency={displayCurrency}
        tone="income"
      />
      <SummaryCard
        label={`Расходы за месяц (${displayCurrency})`}
        value={expense}
        currency={displayCurrency}
        tone="expense"
      />
      <SummaryCard
        label={`Баланс (${displayCurrency})`}
        value={balance}
        currency={displayCurrency}
        tone={balance >= 0 ? "income" : "expense"}
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: Currency;
  tone: "income" | "expense";
}) {
  const color = tone === "income" ? "text-income" : "text-expense";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold tabular-nums ${color}`}>
          {formatMoney(value, currency)}
        </p>
      </CardContent>
    </Card>
  );
}
