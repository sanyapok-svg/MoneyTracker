import "server-only";

import type Stripe from "stripe";
import {
  isPaidDisplayCurrency,
  type Currency,
  type PaidDisplayCurrency,
} from "@/lib/currency";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";

const TABLE = "currency_subscriptions";

export type CurrencySubscription = {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | null;
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function isSubscriptionActive(
  sub: CurrencySubscription | null | undefined,
): boolean {
  if (!sub) return false;
  if (!ACTIVE_STATUSES.has(sub.status)) return false;
  if (!sub.currentPeriodEnd) return true;
  return new Date(sub.currentPeriodEnd).getTime() > Date.now();
}

export function hasPaidConversionAccess(
  sub: CurrencySubscription | null | undefined,
): boolean {
  return isSubscriptionActive(sub);
}

export type SubscriptionDisplay = {
  active: boolean;
  label: string;
  detail: string | null;
  status: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  active: "Оплачена",
  trialing: "Пробный период",
  canceled: "Отменена",
  past_due: "Просрочена",
  unpaid: "Не оплачена",
  incomplete: "Не завершена",
  incomplete_expired: "Истекла",
  paused: "Приостановлена",
};

export function getSubscriptionDisplay(
  sub: CurrencySubscription | null | undefined,
): SubscriptionDisplay {
  if (!sub || sub.status === "inactive") {
    return { active: false, label: "Нет", detail: null, status: null };
  }

  if (isSubscriptionActive(sub)) {
    return {
      active: true,
      label: STATUS_LABELS[sub.status] ?? "Оплачена",
      detail: sub.currentPeriodEnd
        ? `до ${formatSubscriptionDate(sub.currentPeriodEnd)}`
        : null,
      status: sub.status,
    };
  }

  return {
    active: false,
    label: STATUS_LABELS[sub.status] ?? sub.status,
    detail: sub.currentPeriodEnd
      ? `период до ${formatSubscriptionDate(sub.currentPeriodEnd)}`
      : null,
    status: sub.status,
  };
}

function formatSubscriptionDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export async function listSubscriptionsForUserIds(
  userIds: string[],
): Promise<Map<string, CurrencySubscription>> {
  const map = new Map<string, CurrencySubscription>();
  if (userIds.length === 0) return map;
  if (!getSupabaseServiceRoleKey()) return map;

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from(TABLE)
    .select(
      "user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end",
    )
    .in("user_id", userIds);

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return map;
    throw new Error(`Подписки: ${error.message}`);
  }

  for (const row of data ?? []) {
    map.set(row.user_id, rowToSubscription(row));
  }
  return map;
}

function rowToSubscription(row: {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
}): CurrencySubscription {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
  };
}

export async function getUserSubscription(
  userId: string,
): Promise<CurrencySubscription | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw new Error(`Подписка: ${error.message}`);
  }
  if (!data) return null;
  return rowToSubscription(data);
}

export async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  userId: string,
): Promise<void> {
  if (!getSupabaseServiceRoleKey()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY нужен для сохранения подписки");
  }

  const admin = createSupabaseServiceRoleClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { error } = await admin.from(TABLE).upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: subscriptionPeriodEndIso(subscription),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Сохранение подписки: ${error.message}`);
  }
}

export function userIdFromStripeMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const id = metadata?.supabase_user_id?.trim();
  return id || null;
}

function subscriptionPeriodEndIso(
  subscription: Stripe.Subscription,
): string | null {
  const ends = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((t): t is number => typeof t === "number" && t > 0);
  if (ends.length === 0) return null;
  const max = Math.max(...ends);
  return new Date(max * 1000).toISOString();
}

export async function syncCheckoutSession(
  sessionId: string,
  userId: string,
): Promise<CurrencySubscription | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.metadata?.supabase_user_id !== userId) {
    return null;
  }

  const sub = session.subscription;
  if (!sub || typeof sub === "string") {
    return getUserSubscription(userId);
  }

  await upsertSubscriptionFromStripe(sub, userId);
  return getUserSubscription(userId);
}

export function assertPaidDisplayCurrency(
  currency: Currency,
): asserts currency is PaidDisplayCurrency {
  if (!isPaidDisplayCurrency(currency)) {
    throw new Error("Валюта не требует подписки");
  }
}
