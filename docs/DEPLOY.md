# Деплой Money Tracker на Vercel

## Что понадобится

- Аккаунт на [Vercel](https://vercel.com) (логин через GitHub удобнее всего).
- Локальный git и аккаунт GitHub (репозиторий пушим туда).
- Уже работающий проект Supabase с применённой миграцией
  `supabase/migrations/0001_transactions.sql`.

## Шаги

### 1. Завести git-репозиторий

В корне проекта (`c:\Users\bovtr\MoneyTracker`):

```powershell
git init
git add .
git commit -m "feat: money tracker MVP (tasks 1-11)"
```

Создайте пустой репозиторий на GitHub (через web UI или `gh repo create money-tracker --private --source . --remote origin --push`).

```powershell
git remote add origin https://github.com/<user>/money-tracker.git
git branch -M main
git push -u origin main
```

> `.env.local` уже в `.gitignore` — секреты в репозиторий не попадут.

### 2. Импортировать проект в Vercel

1. Откройте [vercel.com/new](https://vercel.com/new).
2. Выберите репозиторий `money-tracker`.
3. **Framework**: Next.js (определится автоматически).
4. **Root Directory**: оставить `./`.
5. **Build / Output Settings**: ничего менять не нужно.

### 3. Добавить env-переменные

В разделе **Environment Variables** проекта Vercel добавьте на все три окружения (Production, Preview, Development):

| Имя | Значение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fpcecyscygefrblgiyst.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` можно не дублировать — код возьмёт publishable.

### 4. Deploy

Нажмите **Deploy**. Через ~30–60 секунд получите URL вида
`https://money-tracker-<hash>.vercel.app`.

### 5. Проверить продакшн

- Открыть главную — должны появиться баланс и таблица.
- `/api/transactions` — `200` и JSON.
- Добавить / отредактировать / удалить транзакцию через UI.

### 6. Автодеплой

Любой `git push origin main` теперь автоматически:
- запускает сборку,
- обновляет production-домен,
- параллельно создаёт preview-деплой для PR.

## Альтернатива: Vercel CLI

Можно без UI:

```powershell
npm i -g vercel
vercel login
vercel link        # привязать локальную папку к проекту Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel --prod
```

## Если что-то не работает

| Симптом | Что проверить |
|---|---|
| 500 + `Could not find the table 'public.transactions'` | Миграция применена не в том проекте Supabase — сверьте URL. |
| 500 + `Не заданы переменные окружения Supabase` | Env-переменные в Vercel заданы не для нужного окружения / не переразвёрнуто после добавления. |
| Главная пуста, но `/api/transactions` отдаёт данные | Очистить кэш Vercel: Settings → Functions → Redeploy with cache cleared. |
