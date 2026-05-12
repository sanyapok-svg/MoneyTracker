import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listTransactions,
  type TransactionFilter,
} from "@/lib/transactions";
import { transactionInputSchema } from "@/lib/types";

const VALID_FILTERS: TransactionFilter[] = ["all", "income", "expense"];

export async function GET(request: NextRequest) {
  const typeParam = request.nextUrl.searchParams.get("type") ?? "all";
  const filter: TransactionFilter = (
    VALID_FILTERS as string[]
  ).includes(typeParam)
    ? (typeParam as TransactionFilter)
    : "all";

  try {
    const transactions = await listTransactions(filter);
    return NextResponse.json({ data: transactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ожидается JSON-тело" }, { status: 400 });
  }

  const parsed = transactionInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка валидации", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
