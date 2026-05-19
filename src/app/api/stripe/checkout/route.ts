import { NextResponse } from "next/server";
import { isPaidDisplayCurrency, type Currency } from "@/lib/currency";
import { assertPaidDisplayCurrency } from "@/lib/subscriptions";
import { getSiteUrlFromHeaders } from "@/lib/site-url";
import {
  getStripe,
  isStripeConfigured,
  PAID_CONVERSION_PRICE_USD,
} from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = { displayCurrency?: Currency };

function checkoutLineItems() {
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (priceId) {
    return [{ price: priceId, quantity: 1 }];
  }
  return [
    {
      price_data: {
        currency: "usd",
        unit_amount: PAID_CONVERSION_PRICE_USD * 100,
        recurring: { interval: "month" as const },
        product_data: {
          name: "Конвертация RUB и KZT",
          description:
            "Отображение сумм в российских рублях и тенге в Money Tracker",
        },
      },
      quantity: 1,
    },
  ];
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Оплата не настроена (STRIPE_SECRET_KEY)" },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const target = body.displayCurrency;
  if (target && !isPaidDisplayCurrency(target)) {
    return NextResponse.json(
      { error: "Эта валюта доступна бесплатно" },
      { status: 400 },
    );
  }
  if (target) assertPaidDisplayCurrency(target);

  const siteUrl = getSiteUrlFromHeaders(request.headers);
  const displayParam = target ? `&display=${target}` : "";
  const successUrl = `${siteUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}${displayParam}`;
  const cancelUrl = `${siteUrl}/?checkout=canceled`;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email ?? undefined,
    line_items: checkoutLineItems(),
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      supabase_user_id: user.id,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
      },
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Не удалось создать сессию оплаты" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}
