"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { deleteTransaction } from "@/app/actions";
import type { Transaction } from "@/lib/types";

export function TransactionRowActions({ transaction }: { transaction: Transaction }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Точно удалить эту транзакцию?")) return;
    startTransition(async () => {
      try {
        await deleteTransaction(transaction.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка удаления";
        window.alert(message);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <AddTransactionDialog
        initial={transaction}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Редактировать"
          >
            <Pencil className="size-4" />
          </Button>
        }
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={pending}
        aria-label="Удалить"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
