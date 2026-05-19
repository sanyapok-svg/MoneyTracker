import { Check, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  hasPaidConversion: boolean;
  className?: string;
};

type ModuleRow = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  tier: "free" | "paid";
};

function buildModules(hasPaidConversion: boolean): ModuleRow[] {
  return [
    {
      id: "display-free",
      title: "Конвертация BYN, USD, EUR",
      description: "Баланс и список транзакций в выбранной валюте",
      unlocked: true,
      tier: "free",
    },
    {
      id: "display-rub",
      title: "Конвертация RUB",
      description: "Отображение сумм в российских рублях",
      unlocked: hasPaidConversion,
      tier: "paid",
    },
    {
      id: "display-kzt",
      title: "Конвертация KZT",
      description: "Отображение сумм в тенге",
      unlocked: hasPaidConversion,
      tier: "paid",
    },
  ];
}

export function SubscriptionAccessOverview({
  hasPaidConversion,
  className,
}: Props) {
  const modules = buildModules(hasPaidConversion);

  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/20 p-4 text-sm",
        className,
      )}
      aria-label="Доступные модули"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Модули конвертации</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
            hasPaidConversion
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {hasPaidConversion ? (
            <>
              <Sparkles className="size-3" aria-hidden />
              Подписка активна
            </>
          ) : (
            "Без подписки"
          )}
        </span>
      </div>

      <ul className="space-y-2">
        {modules.map((mod) => (
          <li
            key={mod.id}
            className={cn(
              "flex gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              mod.unlocked
                ? "border-emerald-500/25 bg-emerald-500/5"
                : "border-dashed border-muted-foreground/30 bg-background/60 opacity-90",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                mod.unlocked
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
              )}
              aria-hidden
            >
              {mod.unlocked ? (
                <Check className="size-3.5" strokeWidth={2.5} />
              ) : (
                <Lock className="size-3.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "font-medium",
                    !mod.unlocked && "text-muted-foreground",
                  )}
                >
                  {mod.title}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    mod.tier === "free"
                      ? "bg-sky-500/10 text-sky-800 dark:text-sky-200"
                      : mod.unlocked
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                        : "bg-amber-500/10 text-amber-900 dark:text-amber-100",
                  )}
                >
                  {mod.tier === "free"
                    ? "Бесплатно"
                    : mod.unlocked
                      ? "Открыто"
                      : "$5/мес"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {mod.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
