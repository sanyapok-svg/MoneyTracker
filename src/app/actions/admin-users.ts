"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminUser } from "@/lib/admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const userIdSchema = z.string().uuid("Некорректный идентификатор пользователя");

export type AdminUserMutationResult =
  | { ok: true }
  | { ok: false; message: string };

async function requireAdminActor(): Promise<
  | { ok: true; actorId: string }
  | { ok: false; message: string }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Требуется вход" };
  if (!isAdminUser(user)) return { ok: false, message: "Нет доступа" };
  return { ok: true, actorId: user.id };
}

function tryServiceClient():
  | { ok: true; client: ReturnType<typeof createSupabaseServiceRoleClient> }
  | { ok: false; message: string } {
  try {
    return { ok: true, client: createSupabaseServiceRoleClient() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка конфигурации сервера";
    return { ok: false, message: msg };
  }
}

export async function adminBlockUser(userId: string): Promise<AdminUserMutationResult> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Ошибка" };

  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  if (parsed.data === gate.actorId) {
    return { ok: false, message: "Нельзя заблокировать себя" };
  }

  const svc = tryServiceClient();
  if (!svc.ok) return svc;

  const { error } = await svc.client.auth.admin.updateUserById(parsed.data, {
    ban_duration: "876000h",
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function adminUnblockUser(userId: string): Promise<AdminUserMutationResult> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Ошибка" };

  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  if (parsed.data === gate.actorId) {
    return { ok: false, message: "Нельзя изменить блокировку для себя" };
  }

  const svc = tryServiceClient();
  if (!svc.ok) return svc;

  const { error } = await svc.client.auth.admin.updateUserById(parsed.data, {
    ban_duration: "none",
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function adminDeleteUser(userId: string): Promise<AdminUserMutationResult> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Ошибка" };

  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  if (parsed.data === gate.actorId) {
    return { ok: false, message: "Нельзя удалить себя" };
  }

  const svc = tryServiceClient();
  if (!svc.ok) return svc;

  const { error } = await svc.client.auth.admin.deleteUser(parsed.data);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
