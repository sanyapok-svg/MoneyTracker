import "server-only";

import Stripe from "stripe";

export const PAID_CONVERSION_PRICE_USD = 5;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Не задан STRIPE_SECRET_KEY. Добавьте секретный ключ Stripe в .env.local",
    );
  }
  return new Stripe(key);
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("Не задан STRIPE_WEBHOOK_SECRET");
  }
  return secret;
}

export function getStripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}
