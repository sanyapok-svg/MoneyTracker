import { z } from "zod";

export const TRANSACTION_CATEGORIES = [
  "Зарплата",
  "Фриланс",
  "Еда",
  "Транспорт",
  "Развлечения",
  "Прочее",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];
export type TransactionType = "income" | "expense";

export const transactionInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().min(1, "Сумма должна быть не меньше 1"),
  category: z.enum(TRANSACTION_CATEGORIES),
  description: z.string().max(280).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Ожидается формат YYYY-MM-DD"),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export type Transaction = TransactionInput & {
  id: number;
  created_at: string;
};
