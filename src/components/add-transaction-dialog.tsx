"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction-form";
import type { Transaction } from "@/lib/types";

type Props = {
  initial?: Transaction;
  trigger?: React.ReactElement;
};

export function AddTransactionDialog({ initial, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(initial);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button>+ Добавить</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Изменить транзакцию" : "Новая транзакция"}
          </DialogTitle>
          <DialogDescription>
            Заполните поля формы. Все суммы — в рублях.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm initial={initial} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
