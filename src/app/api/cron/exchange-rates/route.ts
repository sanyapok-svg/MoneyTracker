import { NextResponse } from "next/server";
import { refreshExchangeRatesFromNbrb } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await refreshExchangeRatesFromNbrb();
    return NextResponse.json({
      ok: true,
      updated: rows.length,
      at: rows[0]?.updated_at ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обновления курсов";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
