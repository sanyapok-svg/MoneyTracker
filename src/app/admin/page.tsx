import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { SignOutForm } from "@/components/sign-out-form";
import { buttonVariants } from "@/components/ui/button";
import {
  isAdminUser,
  toAdminUserListItem,
} from "@/lib/admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSubscriptionDisplay,
  listSubscriptionsForUserIds,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ page?: string }>;

const PER_PAGE = 50;

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!getSupabaseEnv()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  const sp = await searchParams;
  const page = parsePage(sp.page);

  const serviceKey = getSupabaseServiceRoleKey();
  let listError: string | null = null;
  let users: ReturnType<typeof toAdminUserListItem>[] = [];
  let lastPage = 1;
  let total = 0;

  if (serviceKey) {
    try {
      const adminClient = createSupabaseServiceRoleClient();
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage: PER_PAGE,
      });
      if (error) {
        listError = error.message;
      } else if (data) {
        const subMap = await listSubscriptionsForUserIds(
          data.users.map((u) => u.id),
        );
        users = data.users.map((u) =>
          toAdminUserListItem(
            u,
            getSubscriptionDisplay(subMap.get(u.id) ?? null),
          ),
        );
        lastPage = data.lastPage ?? 1;
        total = data.total ?? users.length;
      }
    } catch (e) {
      listError =
        e instanceof Error ? e.message : "Не удалось загрузить пользователей";
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Админка</h1>
          <p className="text-sm text-muted-foreground">
            Пользователи Supabase Auth
            <span className="mt-1 block text-xs text-muted-foreground">
              {user.email}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            На главную
          </Link>
          <SignOutForm />
        </div>
      </header>

      {!serviceKey ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-950 dark:text-amber-100">
            Не задан SUPABASE_SERVICE_ROLE_KEY
          </p>
          <p className="mt-1 text-muted-foreground">
            Добавьте сервисный ключ проекта в{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              .env.local
            </code>{" "}
            (без префикса NEXT_PUBLIC_). Ключ — в Supabase → Settings → API →
            service_role. После сохранения перезапустите dev-сервер.
          </p>
        </div>
      ) : null}

      {listError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {listError}
        </div>
      ) : null}

      {serviceKey && !listError ? (
        <>
          <p className="text-sm text-muted-foreground">
            Всего пользователей: {total}
            {lastPage > 1 ? ` · страница ${page} из ${lastPage}` : null}
          </p>
          <AdminUsersTable users={users} currentUserId={user.id} />
          {lastPage > 1 ? (
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              {page > 1 ? (
                <Link
                  href={`/admin?page=${page - 1}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Назад
                </Link>
              ) : null}
              {page < lastPage ? (
                <Link
                  href={`/admin?page=${page + 1}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Дальше
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
