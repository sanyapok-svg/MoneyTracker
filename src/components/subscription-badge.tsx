import type { SubscriptionDisplay } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

type Props = {
  subscription: SubscriptionDisplay;
  className?: string;
};

export function SubscriptionBadge({ subscription, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        subscription.active
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
          : "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
      title={
        subscription.detail
          ? `Подписка RUB/KZT: ${subscription.label} (${subscription.detail})`
          : `Подписка RUB/KZT: ${subscription.label}`
      }
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          subscription.active ? "bg-emerald-500" : "bg-muted-foreground/50",
        )}
        aria-hidden
      />
      {subscription.active ? "Подписка RUB/KZT" : "Без подписки"}
      {subscription.active && subscription.detail ? (
        <span className="font-normal opacity-80">· {subscription.detail}</span>
      ) : null}
      {!subscription.active && subscription.status ? (
        <span className="font-normal opacity-80">· {subscription.label}</span>
      ) : null}
    </span>
  );
}
