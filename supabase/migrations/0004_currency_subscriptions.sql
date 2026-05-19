-- Подписка на конвертацию в RUB и KZT (Stripe)
-- Supabase Studio → SQL Editor → Run

create table if not exists public.currency_subscriptions (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  status                  text not null default 'inactive',
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

create index if not exists currency_subscriptions_status_idx
  on public.currency_subscriptions (status);

alter table public.currency_subscriptions enable row level security;

drop policy if exists "currency_subscriptions_select_own" on public.currency_subscriptions;
create policy "currency_subscriptions_select_own"
  on public.currency_subscriptions for select
  using (auth.uid() = user_id);

-- Запись только с service_role (webhook Stripe)
