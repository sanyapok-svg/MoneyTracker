"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { transactionInputSchema } from "@/lib/types";

const TABLE = "transactions";

export type FormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function parseFormData(formData: FormData) {
  const raw = {
    type: formData.get("type"),
    amount: Number(formData.get("amount")),
    category: formData.get("category"),
    description: formData.get("description") || null,
    date: formData.get("date"),
  };
  return transactionInputSchema.safeParse(raw);
}

function toErrorState(
  parsed: ReturnType<typeof transactionInputSchema.safeParse>,
): FormState {
  if (parsed.success) {
    return { status: "error", message: "Неизвестная ошибка" };
  }
  const flat = parsed.error.flatten();
  return {
    status: "error",
    message: "Проверьте поля формы",
    fieldErrors: flat.fieldErrors as Record<string, string[]>,
  };
}

export async function addTransaction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseFormData(formData);
  if (!parsed.success) return toErrorState(parsed);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Сессия истекла. Войдите снова." };
  }

  const { error } = await supabase
    .from(TABLE)
    .insert({ ...parsed.data, user_id: user.id });
  if (error) {
    return { status: "error", message: `Supabase: ${error.message}` };
  }

  revalidatePath("/");
  return { status: "success" };
}

export async function updateTransaction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseFormData(formData);
  if (!parsed.success) return toErrorState(parsed);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Сессия истекла. Войдите снова." };
  }

  const { error } = await supabase
    .from(TABLE)
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return { status: "error", message: `Supabase: ${error.message}` };
  }

  revalidatePath("/");
  return { status: "success" };
}

export async function deleteTransaction(id: number): Promise<void> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Некорректный id транзакции");
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Требуется вход");
  }
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    throw new Error(`Не удалось удалить транзакцию: ${error.message}`);
  }
  revalidatePath("/");
}
