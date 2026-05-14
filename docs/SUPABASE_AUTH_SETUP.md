# Настройка Supabase Auth (задача 13)

Чек-лист в [Supabase Dashboard](https://supabase.com/dashboard) для проекта Money Tracker.

## Email / пароль

1. **Authentication → Providers → Email** — включён.
2. При необходимости: **Confirm email** (для продакшена обычно включено; в dev можно отключить для быстрых тестов).
3. **Authentication → URL Configuration**
   - **Site URL**: для локальной разработки `http://localhost:3000`; для продакшена — ваш `https://….vercel.app`.
   - **Redirect URLs** — добавьте:
     - `http://localhost:3000/auth/callback`
     - `https://<ваш-домен-vercel>/auth/callback`

## OAuth (Google и GitHub)

1. **Authentication → Providers → Google** — включить, вставить **Client ID** и **Client Secret** из Google Cloud Console (тип OAuth «Web application», authorized redirect URI = Supabase callback URL из подсказки в UI).
2. **Authentication → Providers → GitHub** — включить, создать OAuth App на GitHub, callback URL из подсказки Supabase.
3. Снова проверьте **Redirect URLs** (см. выше).

## Переменные окружения приложения

В `.env.local` / Vercel:

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` или `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публичный ключ |
| `NEXT_PUBLIC_SITE_URL` (опционально) | полный origin для OAuth, например `https://xxx.vercel.app`. Если не задан — берётся из заголовков запроса. |

## Миграция БД после первого пользователя

Выполните SQL из `supabase/migrations/0002_auth_user_id_rls.sql`.  
Старые строки без `user_id` будут удалены — после миграции транзакции создаются только из приложения под залогиненным пользователем.

## Безопасность

- **Service Role** ключ не хранить в клиенте и не коммитить.
- `user_id` в транзакциях задаётся только на сервере из `auth.getUser()`, не из тела формы.
