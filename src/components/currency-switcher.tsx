"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CURRENCIES,
  CURRENCY_LABELS,
  isPaidDisplayCurrency,
  type Currency,
} from "@/lib/currency";
import type { TransactionFilter } from "@/lib/transactions";
import { homeUrl } from "@/lib/urls";

type Props = {
  current: Currency;
  filter: TransactionFilter;
  hasPaidConversion: boolean;
  stripeEnabled: boolean;
};

export function CurrencySwitcher({
  current,
  filter,
  hasPaidConversion,
  stripeEnabled,
}: Props) {
  const [loadingCurrency, setLoadingCurrency] = useState<Currency | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(currency: Currency) {
    setError(null);
    setLoadingCurrency(currency);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayCurrency: currency }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Не удалось открыть оплату");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка оплаты");
      setLoadingCurrency(null);
    }
  }

  return (
    <div className="space-y-2">
      <nav
        className="flex flex-wrap gap-1 rounded-md border p-0.5"
        aria-label="Валюта отображения"
      >
        {CURRENCIES.map((currency) => {
          const active = currency === current;
          const paid = isPaidDisplayCurrency(currency);
          const locked = paid && !hasPaidConversion;

          if (locked) {
            return (
              <Button
                key={currency}
                type="button"
                variant="ghost"
                size="sm"
                disabled={!stripeEnabled || loadingCurrency === currency}
                title={
                  stripeEnabled
                    ? `${CURRENCY_LABELS[currency]} — $5/мес`
                    : "Оплата не настроена"
                }
                className="h-auto gap-1 rounded-sm px-2.5 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm"
                onClick={() => startCheckout(currency)}
              >
                <Lock className="size-3.5 opacity-70" aria-hidden />
                {currency}
              </Button>
            );
          }

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
              {paid && hasPaidConversion ? (
                <span className="sr-only"> (подписка активна)</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      {!hasPaidConversion ? (
        <p className="text-xs text-muted-foreground">
          RUB и KZT — платная конвертация ($5/мес). USD и EUR — бесплатно.
        </p>
      ) : (
        <ManageSubscriptionButton />
      )}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Не удалось открыть кабинет");
      }
      window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto p-0 text-xs text-muted-foreground"
      disabled={loading}
      onClick={openPortal}
    >
      Управление подпиской
    </Button>
  );
}
