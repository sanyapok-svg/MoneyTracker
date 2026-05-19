import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import { TransactionRowActions } from "@/components/transaction-row-actions";
import {
  convertAmount,
  type Currency,
  type RatesMap,
} from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import type { Wallet } from "@/lib/wallets";

type Props = {
  transactions: Transaction[];
  displayCurrency: Currency;
  rates: RatesMap;
  wallets: Wallet[];
};

export function TransactionList({
  transactions,
  displayCurrency,
  rates,
  wallets,
}: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-base font-medium">Транзакций пока нет</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Добавьте первую запись, чтобы увидеть список и баланс.
        </p>
        <AddTransactionDialog
          wallets={wallets}
          trigger={<Button className="mt-4">+ Добавить первую</Button>}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <Th>Дата</Th>
            <Th>Тип</Th>
            <Th>Валюта</Th>
            <Th>Категория</Th>
            <Th>Описание</Th>
            <Th className="text-right">Сумма</Th>
            <Th className="text-right">Действия</Th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const cur = (t.currency ?? "BYN") as Currency;
            const tone = t.type === "income" ? "text-income" : "text-expense";
            const sign = t.type === "income" ? "+" : "−";
            const native = Number(t.amount);
            const shown = convertAmount(native, cur, displayCurrency, rates);
            return (
              <tr key={t.id} className="border-t">
                <Td>{formatDate(t.date)}</Td>
                <Td className={tone}>
                  {t.type === "income" ? "Доход" : "Расход"}
                </Td>
                <Td className="font-mono text-xs">{cur}</Td>
                <Td>{t.category}</Td>
                <Td className="text-muted-foreground">{t.description ?? ""}</Td>
                <Td className={`text-right font-medium ${tone}`}>
                  <div>
                    {sign} {formatMoney(shown, displayCurrency)}
                  </div>
                  {cur !== displayCurrency ? (
                    <div className="text-xs font-normal text-muted-foreground">
                      {sign} {formatMoney(native, cur)}
                    </div>
                  ) : null}
                </Td>
                <Td className="text-right">
                  <TransactionRowActions transaction={t} wallets={wallets} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-4 py-2 font-medium text-muted-foreground ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-2 align-middle ${className}`}>{children}</td>;
}
