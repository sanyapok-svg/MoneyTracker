type Props = {
  reason: "missing-env" | "missing-table" | "missing-multi-currency";
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

  if (reason === "missing-multi-currency") {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
        <h2 className="text-base font-medium">Нужна миграция мультивалютности</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          В таблице <code>transactions</code> нет колонки <code>currency</code>.
          Выполните в Supabase Studio → SQL Editor:
        </p>
        <p className="mt-2 font-mono text-xs">
          supabase/migrations/0003_multi_currency.sql
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>SQL Editor → New query → вставьте файл → Run.</li>
          <li>Обновите страницу — появятся курсы НБ РБ и кошельки.</li>
        </ol>
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
