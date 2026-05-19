import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe";
import {
  upsertSubscriptionFromStripe,
  userIdFromStripeMetadata,
} from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

async function handleSubscription(subscription: Stripe.Subscription) {
  const userId = userIdFromStripeMetadata(subscription.metadata);
  if (!userId) return;
  await upsertSubscriptionFromStripe(subscription, userId);
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe не настроен" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Нет подписи Stripe" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Неверная подпись";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = userIdFromStripeMetadata(session.metadata);
        const subId = session.subscription;
        if (userId && subId && typeof subId === "string") {
          const subscription = await stripe.subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(subscription, userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обработки webhook";
    console.error("stripe webhook:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
