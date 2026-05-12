import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTransaction } from "@/lib/transactions";
import { transactionInputSchema } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

function parseId(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return null;
  return n;
}

export async function GET(_request: NextRequest, ctx: Context) {
  const { id: raw } = await ctx.params;
  const id = parseId(raw);
  if (id === null) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  try {
    const transaction = await getTransaction(id);
    if (!transaction) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json({ data: transaction });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: Context) {
  const { id: raw } = await ctx.params;
  const id = parseId(raw);
  if (id === null) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ожидается JSON-тело" }, { status: 400 });
  }

  const parsed = transactionInputSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка валидации", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, ctx: Context) {
  const { id: raw } = await ctx.params;
  const id = parseId(raw);
  if (id === null) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase
    .from("transactions")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
