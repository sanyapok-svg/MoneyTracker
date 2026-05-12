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

2. Создать проект в [Supabase](https://supabase.com/) и применить миграцию из `supabase/migrations/0001_transactions.sql` (Supabase Studio → SQL Editor).

3. Создать `.env.local` по образцу `.env.example`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Поддерживается и старое имя `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
   код возьмёт первое заданное.

4. Запустить:

   ```powershell
   npm run dev
   ```

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
