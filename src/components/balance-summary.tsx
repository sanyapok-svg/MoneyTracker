import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRub } from "@/lib/format";

type Props = {
  income: number;
  expense: number;
};

export function BalanceSummary({ income, expense }: Props) {
  const balance = income - expense;

  return (
    <section
      aria-label="Сводка за месяц"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <SummaryCard label="Доходы за месяц" value={income} tone="income" />
      <SummaryCard label="Расходы за месяц" value={expense} tone="expense" />
      <SummaryCard
        label="Баланс"
        value={balance}
        tone={balance >= 0 ? "income" : "expense"}
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
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
        <div className={`text-2xl font-semibold ${color}`}>{formatRub(value)}</div>
      </CardContent>
    </Card>
  );
}
