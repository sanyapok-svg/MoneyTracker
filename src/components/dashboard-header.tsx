import Link from "next/link";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { SignOutForm } from "@/components/sign-out-form";
import { buttonVariants } from "@/components/ui/button";
import { isAdminUser } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listWallets } from "@/lib/wallets";
import { cn } from "@/lib/utils";

export async function DashboardHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showAdmin = Boolean(user && isAdminUser(user));
  const wallets = user ? await listWallets(user.id) : [];

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">Money Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Личный учёт доходов и расходов
          {user?.email ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showAdmin ? (
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Админка
          </Link>
        ) : null}
        <AddTransactionDialog wallets={wallets} />
        <SignOutForm />
      </div>
    </header>
  );
}
