import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/auth/callback",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/api/transactions")) return true;
  if (pathname.startsWith("/api/stripe/checkout")) return true;
  if (pathname.startsWith("/api/stripe/portal")) return true;
  if (pathname === "/") return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) return response;

  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublicPath(pathname)) {
    if (
      user &&
      (pathname === "/login" || pathname === "/register")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (isProtectedPath(pathname) && !user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Требуется вход" },
        { status: 401 },
      );
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
