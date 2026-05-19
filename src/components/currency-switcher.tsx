"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubscriptionAccessOverview } from "@/components/subscription-access-overview";
import {
  CURRENCY_LABELS,
  FREE_DISPLAY_CURRENCIES,
  PAID_DISPLAY_CURRENCIES,
  type Currency,
} from "@/lib/currency";
import type { TransactionFilter } from "@/lib/transactions";
import { homeUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";

type Props = {
  current: Currency;
  filter: TransactionFilter;
  hasPaidConversion: boolean;
  stripeEnabled: boolean;
};

function CurrencyChip({
  currency,
  active,
  locked,
  unlockedPaid,
  filter,
  loading,
  stripeEnabled,
  onCheckout,
}: {
  currency: Currency;
  active: boolean;
  locked: boolean;
  unlockedPaid: boolean;
  filter: TransactionFilter;
  loading: boolean;
  stripeEnabled: boolean;
  onCheckout: () => void;
}) {
  const baseClass =
    "inline-flex items-center gap-1 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm";

  if (locked) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!stripeEnabled || loading}
        title={
          stripeEnabled
            ? `${CURRENCY_LABELS[currency]} — откроется после подписки ($5/мес)`
            : "Оплата не настроена"
        }
        className={cn(
          baseClass,
          "h-auto border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-950/80 hover:bg-amber-500/10 dark:text-amber-100",
        )}
        onClick={onCheckout}
      >
        <Lock className="size-3.5 shrink-0 opacity-80" aria-hidden />
        {currency}
      </Button>
    );
  }

  return (
    <Link
      href={homeUrl({ type: filter, display: currency })}
      scroll={false}
      title={CURRENCY_LABELS[currency]}
      className={cn(
        baseClass,
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        unlockedPaid &&
          !active &&
          "ring-1 ring-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100",
      )}
      aria-current={active ? "true" : undefined}
    >
      {unlockedPaid ? (
        <Check className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      ) : null}
      {currency}
    </Link>
  );
}

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
    <div className="space-y-4">
      <SubscriptionAccessOverview hasPaidConversion={hasPaidConversion} />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-sky-800 dark:text-sky-200">
            Бесплатно · всегда открыто
          </p>
          <nav
            className="flex flex-wrap gap-1 rounded-md border border-sky-500/20 bg-sky-500/5 p-0.5"
            aria-label="Бесплатные валюты отображения"
          >
            {FREE_DISPLAY_CURRENCIES.map((currency) => (
              <CurrencyChip
                key={currency}
                currency={currency}
                active={currency === current}
                locked={false}
                unlockedPaid={false}
                filter={filter}
                loading={loadingCurrency === currency}
                stripeEnabled={stripeEnabled}
                onCheckout={() => startCheckout(currency)}
              />
            ))}
          </nav>
        </div>

        <div className="space-y-1.5">
          <p
            className={cn(
              "text-xs font-medium",
              hasPaidConversion
                ? "text-emerald-800 dark:text-emerald-200"
                : "text-amber-900 dark:text-amber-100",
            )}
          >
            {hasPaidConversion
              ? "Подписка · открыто после оплаты"
              : "Подписка $5/мес · откроется после оплаты"}
          </p>
          <nav
            className={cn(
              "flex flex-wrap gap-1 rounded-md border p-0.5",
              hasPaidConversion
                ? "border-emerald-500/25 bg-emerald-500/5"
                : "border-amber-500/25 bg-amber-500/5",
            )}
            aria-label="Валюты по подписке"
          >
            {PAID_DISPLAY_CURRENCIES.map((currency) => {
              const locked = !hasPaidConversion;
              return (
                <CurrencyChip
                  key={currency}
                  currency={currency}
                  active={currency === current}
                  locked={locked}
                  unlockedPaid={hasPaidConversion}
                  filter={filter}
                  loading={loadingCurrency === currency}
                  stripeEnabled={stripeEnabled}
                  onCheckout={() => startCheckout(currency)}
                />
              );
            })}
          </nav>
        </div>
      </div>

      {!hasPaidConversion ? (
        <p className="text-xs text-muted-foreground">
          Нажмите на RUB или KZT с замком, чтобы оформить подписку и открыть
          конвертацию.
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
