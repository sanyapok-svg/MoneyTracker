import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCIES, CURRENCY_LABELS } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { Wallet } from "@/lib/wallets";

type Props = {
  wallets: Wallet[];
};

export function WalletsSummary({ wallets }: Props) {
  const byCur = Object.fromEntries(wallets.map((w) => [w.currency, w]));

  return (
    <section aria-label="Кошельки" className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Кошельки</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CURRENCIES.map((currency) => {
          const balance = byCur[currency]?.balance ?? 0;
          return (
            <Card key={currency}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {currency}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-base font-semibold leading-tight tabular-nums sm:text-lg">
                  {formatMoney(balance, currency)}
                </p>
                <p className="text-xs leading-snug text-muted-foreground">
                  {CURRENCY_LABELS[currency]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
