type Props = {
  reason: "missing-env" | "missing-table";
};

export function SetupNotice({ reason }: Props) {
  if (reason === "missing-env") {
    return (
      <div className="rounded-xl border border-dashed p-6">
        <h2 className="text-base font-medium">Подключите Supabase</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          В <code>.env.local</code> нужны переменные
          {" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> и
          {" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed p-6">
      <h2 className="text-base font-medium">База данных ещё не настроена</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Таблица <code>public.transactions</code> не найдена.
        Примените миграцию <code>supabase/migrations/0001_transactions.sql</code>:
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Откройте Supabase Studio → SQL Editor → New query.</li>
        <li>Вставьте содержимое файла миграции и нажмите Run.</li>
        <li>Обновите эту страницу — появятся карточки баланса и таблица.</li>
      </ol>
    </div>
  );
}
