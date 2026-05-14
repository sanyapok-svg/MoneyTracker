"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

const INITIAL: AuthFormState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL);

  if (state.status === "success" && state.message) {
    return (
      <div className="grid gap-4">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">{state.message}</div>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground underline">
            Перейти ко входу
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">Не короче 8 символов</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm">Подтверждение пароля</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        {state.status === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Регистрация…" : "Зарегистрироваться"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            или
          </span>
        </div>
      </div>

      <SocialAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-foreground underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
