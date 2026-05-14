-- Модуль 7: user_id + RLS по auth.uid()
-- Выполнить в Supabase Studio → SQL Editor после появления хотя бы одного пользователя в auth.users
-- (зарегистрируйтесь через /register или войдите через OAuth).

-- 1. Колонка владельца
alter table public.transactions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- 2. Удаляем демо-строки без владельца (из модуля 6)
delete from public.transactions where user_id is null;

-- 3. Обязательное поле для новых записей
alter table public.transactions
  alter column user_id set not null;

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

-- 4. Старые политики «для всех»
drop policy if exists "transactions_select_all" on public.transactions;
drop policy if exists "transactions_insert_all" on public.transactions;
drop policy if exists "transactions_update_all" on public.transactions;
drop policy if exists "transactions_delete_all" on public.transactions;

-- 5. Политики только для своих строк
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);
