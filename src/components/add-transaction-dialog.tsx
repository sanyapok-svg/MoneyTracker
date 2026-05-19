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
import type { Wallet } from "@/lib/wallets";

type Props = {
  initial?: Transaction;
  wallets: Wallet[];
  trigger?: React.ReactElement;
};

export function AddTransactionDialog({ initial, wallets, trigger }: Props) {
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
            Укажите валюту кошелька. Доход пополняет кошелёк, расход списывает
            с него.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          initial={initial}
          wallets={wallets}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
