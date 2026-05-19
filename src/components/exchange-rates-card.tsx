import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY_LABELS, type Currency, type RatesMap } from "@/lib/currency";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

const DISPLAY_CODES: Currency[] = ["USD", "EUR", "RUB", "KZT"];

type Props = {
  rates: RatesMap;
  lastUpdated: string | null;
  rateDate: string | null;
};

export function ExchangeRatesCard({ rates, lastUpdated, rateDate }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Курсы НБ РБ (к BYN)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="grid gap-2 sm:grid-cols-2">
          {DISPLAY_CODES.map((code) => {
            const row = rates[code];
            const perUnit = row.rate_to_byn;
            const scale = row.cur_scale;
            const label =
              scale > 1
                ? `${formatMoney(row.cur_official_rate, "BYN")} за ${scale} ${code}`
                : `${formatMoney(perUnit, "BYN")} за 1 ${code}`;
            return (
              <li
                key={code}
                className="flex items-baseline justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{code}</span>
                <span className="text-right text-muted-foreground">{label}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          {rateDate ? (
            <>
              Курс на дату НБ РБ: {formatDate(rateDate)}.{" "}
            </>
          ) : null}
          {lastUpdated ? (
            <>
              Обновлено: {formatDateTime(lastUpdated)} (Минск). Ежедневно в 09:00.
            </>
          ) : (
            <>Курсы ещё не загружены.</>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {CURRENCY_LABELS.BYN} — базовая валюта учёта кошельков.
        </p>
      </CardContent>
    </Card>
  );
}
