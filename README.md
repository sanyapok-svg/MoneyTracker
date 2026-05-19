# Money Tracker

Простое веб-приложение учёта доходов и расходов: главная с балансом, таблица транзакций и форма добавления/редактирования.

Подробное ТЗ — в [`.taskmaster/docs/PRD.md`](./.taskmaster/docs/PRD.md). Задачи по реализации — в [`.taskmaster`](./.taskmaster).

## Стек

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase (`@supabase/ssr`) — PostgreSQL + RLS
- Server Actions для мутаций, zod для валидации
- Vercel для деплоя

## Локальный запуск

1. Установить зависимости:

   ```powershell
   npm install
   ```

2. Создать проект в [Supabase](https://supabase.com/) и применить миграции в **Supabase Studio → SQL Editor**:
   - `supabase/migrations/0001_transactions.sql` — таблица `transactions` (модуль 6).
   - `supabase/migrations/0002_auth_user_id_rls.sql` — колонка `user_id`, RLS по `auth.uid()` (модуль 7; демо-строки без владельца удаляются).
   - `supabase/migrations/0003_multi_currency.sql` — курсы НБ РБ, кошельки (BYN, USD, EUR, RUB, KZT), валюта транзакций.

3. Настроить Auth в Supabase: [docs/SUPABASE_AUTH_SETUP.md](./docs/SUPABASE_AUTH_SETUP.md).

4. Создать `.env.local` по образцу `.env.example`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   Для продакшена укажите `NEXT_PUBLIC_SITE_URL=https://<ваш-домен>.vercel.app`.

   Поддерживается и старое имя `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
   код возьмёт первое заданное.

5. Запустить:

   ```powershell
   npm run dev
   ```

   Главная `/` доступна после входа (`/login`). Регистрация — `/register`.

## Мультивалютность

- Курсы **USD, EUR, RUB, KZT** с [API НБ РБ](https://www.nbrb.by/apihelp/exrates); обновление ежедневно в **09:00** (Europe/Minsk) и при открытии главной, если курс устарел.
- На Vercel: cron `0 6 * * *` UTC → `/api/cron/exchange-rates` (см. `vercel.json`). Для сохранения курсов в БД нужен `SUPABASE_SERVICE_ROLE_KEY`.
- Переключатель валюты отображения на главной (`?display=USD` и т.д.).
- Кошельки по валютам: доход пополняет выбранный кошелёк, расход списывает с него.

## Структура

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← главная: баланс + список (Server Component)
│   ├── globals.css
│   ├── actions.ts            ← Server Actions: add/update/delete
│   └── api/transactions/
│       └── route.ts          ← GET /api/transactions (альтернатива)
├── components/
│   ├── ui/                   ← shadcn/ui
│   ├── balance-summary.tsx
│   ├── transaction-form.tsx
│   ├── transaction-list.tsx
│   ├── transaction-row-actions.tsx
│   └── add-transaction-dialog.tsx
├── lib/
│   ├── format.ts
│   ├── types.ts              ← Transaction + zod-схема
│   └── supabase/{client,server}.ts
└── proxy.ts                  ← Supabase SSR refresh (бывший middleware)
```

## Работа с задачами

```powershell
npx --package=task-master-ai task-master list
npx --package=task-master-ai task-master next
npx --package=task-master-ai task-master show 2
```
