import { NextResponse } from "next/server";
import { fetchMinskWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const weather = await fetchMinskWeather();
    return NextResponse.json({
      ok: true,
      observedAt: weather.observedAt,
      temperature: weather.temperature,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обновления погоды";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
