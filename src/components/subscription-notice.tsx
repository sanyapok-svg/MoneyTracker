type Props = {
  checkout: "success" | "canceled" | null;
};

export function SubscriptionNotice({ checkout }: Props) {
  if (!checkout) return null;

  if (checkout === "success") {
    return (
      <div
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100"
        role="status"
      >
        Оплата прошла успешно. Конвертация в RUB и KZT активна.
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
      role="status"
    >
      Оплата отменена. RUB и KZT по-прежнему доступны после оформления подписки.
    </div>
  );
}
