import { NextResponse } from "next/server";
import { getSiteUrlFromHeaders } from "@/lib/site-url";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const sub = await getUserSubscription(user.id);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Нет активной подписки для управления" },
      { status: 404 },
    );
  }

  const siteUrl = getSiteUrlFromHeaders(request.headers);
  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${siteUrl}/`,
  });

  return NextResponse.json({ url: portal.url });
}
