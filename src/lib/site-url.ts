import "server-only";

/**
 * Базовый URL приложения для OAuth redirectTo.
 * В проде задайте NEXT_PUBLIC_SITE_URL (например https://xxx.vercel.app).
 */
export function getSiteUrlFromHeaders(headers: Headers): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/u, "");
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/u, "")}`;

  const host =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const proto = headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
