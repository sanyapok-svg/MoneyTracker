"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/auth/schemas";
import { getSiteUrlFromHeaders } from "@/lib/site-url";

export type AuthFormState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

function parseLogin(formData: FormData) {
  return loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function parseRegister(formData: FormData) {
  return registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseLogin(formData);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    const first = Object.values(msg).flat()[0] ?? "Проверьте поля";
    return { status: "error", message: first };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.message === "Invalid login credentials"
          ? "Неверный email или пароль"
          : error.message,
    };
  }

  const next = formData.get("next");
  const dest =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/";
  revalidatePath("/", "layout");
  redirect(dest);
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseRegister(formData);
  if (!parsed.success) {
    const first =
      parsed.error.flatten().fieldErrors.password?.[0] ??
      parsed.error.flatten().fieldErrors.confirm?.[0] ??
      parsed.error.flatten().fieldErrors.email?.[0] ??
      "Проверьте поля";
    return { status: "error", message: first };
  }

  const supabase = await createSupabaseServerClient();
  const hdrs = await headers();
  const site = getSiteUrlFromHeaders(hdrs);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${site}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return {
    status: "success",
    message:
      "Проверьте почту: мы отправили письмо со ссылкой для подтверждения.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = await createSupabaseServerClient();
  const hdrs = await headers();
  const site = getSiteUrlFromHeaders(hdrs);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${site}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`,
    );
  }
  redirect(data.url);
}

export async function signInWithGoogleAction(_formData: FormData) {
  await signInWithOAuth("google");
}

export async function signInWithGithubAction(_formData: FormData) {
  await signInWithOAuth("github");
}
