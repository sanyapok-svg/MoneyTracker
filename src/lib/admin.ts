import type { User } from "@supabase/supabase-js";

export type AdminUserListItem = {
  id: string;
  email: string | null;
  created_at: string;
  banned_until?: string | null;
  last_sign_in_at?: string | null;
};

export function toAdminUserListItem(user: User): AdminUserListItem {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    banned_until: user.banned_until ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
  };
}

export function isUserBanned(user: Pick<AdminUserListItem, "banned_until">): boolean {
  if (!user.banned_until) return false;
  const until = new Date(user.banned_until);
  return !Number.isNaN(until.getTime()) && until > new Date();
}

export function normalizeAdminEmail(email: string | undefined | null): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Админ — пользователь, чей email совпадает с ADMIN_EMAIL (после trim и без учёта регистра).
 * Если ADMIN_EMAIL не задан, админов нет.
 */
export function isAdminUser(user: Pick<User, "email"> | null | undefined): boolean {
  const configured = process.env.ADMIN_EMAIL?.trim();
  if (!configured || !user?.email) return false;
  return normalizeAdminEmail(user.email) === normalizeAdminEmail(configured);
}
