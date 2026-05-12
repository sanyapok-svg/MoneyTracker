"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addTransaction,
  updateTransaction,
  type FormState,
} from "@/app/actions";
import { TRANSACTION_CATEGORIES, type Transaction } from "@/lib/types";

const INITIAL_STATE: FormState = { status: "idle" };

type Props = {
  initial?: Transaction;
  onSuccess?: () => void;
};

export function TransactionForm({ initial, onSuccess }: Props) {
  const action = initial
    ? updateTransaction.bind(null, initial.id)
    : addTransaction;

  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  if (state.status === "success") {
    queueMicrotask(() => onSuccess?.());
  }

  const today = new Date().toISOString().slice(0, 10);
  const fieldErrors =
    state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="grid gap-4" aria-label="Форма транзакции">
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Тип</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="type"
              value="income"
              defaultChecked={initial?.type !== "expense"}
              required
            />
            Доход
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="type"
              value="expense"
              defaultChecked={initial?.type === "expense"}
              required
            />
            Расход
          </label>
        </div>
        <FieldError messages={fieldErrors.type} />
      </fieldset>

      <Field label="Сумма" htmlFor="amount" error={fieldErrors.amount}>
        <Input
          id="amount"
          type="number"
          name="amount"
          min={1}
          step="0.01"
          required
          defaultValue={initial?.amount}
        />
      </Field>

      <Field label="Категория" htmlFor="category" error={fieldErrors.category}>
        <Select name="category" defaultValue={initial?.category} required>
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Выберите категорию" />
          </SelectTrigger>
          <SelectContent>
            {TRANSACTION_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Описание (необязательно)"
        htmlFor="description"
        error={fieldErrors.description}
      >
        <Input
          id="description"
          type="text"
          name="description"
          maxLength={280}
          defaultValue={initial?.description ?? ""}
        />
      </Field>

      <Field label="Дата" htmlFor="date" error={fieldErrors.date}>
        <Input
          id="date"
          type="date"
          name="date"
          required
          defaultValue={initial?.date ?? today}
        />
      </Field>

      {state.status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending
          ? "Сохраняем…"
          : initial
            ? "Сохранить изменения"
            : "Добавить"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  error,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  error?: string[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError messages={error} />
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {messages.join(", ")}
    </p>
  );
}
