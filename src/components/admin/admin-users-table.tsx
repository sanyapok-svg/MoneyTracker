"use client";

import { useTransition } from "react";
import {
  adminBlockUser,
  adminDeleteUser,
  adminUnblockUser,
} from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";
import type { AdminUserListItem } from "@/lib/admin";
import { isUserBanned } from "@/lib/admin";
import { formatDate } from "@/lib/format";

type Props = {
  users: AdminUserListItem[];
  currentUserId: string;
};

export function AdminUsersTable({ users, currentUserId }: Props) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok && "message" in res && res.message) {
        window.alert(res.message);
      }
    });
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Пользователей пока нет.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Регистрация</th>
            <th className="px-3 py-2 font-medium">Последний вход</th>
            <th className="px-3 py-2 font-medium">Статус</th>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 text-right font-medium">Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const banned = isUserBanned(u);
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.email ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatDate(u.created_at)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : "—"}
                </td>
                <td className="px-3 py-2">
                  {banned ? (
                    <span className="text-destructive">Заблокирован</span>
                  ) : (
                    <span className="text-muted-foreground">Активен</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {u.id.slice(0, 8)}…
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    {banned ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={pending || isSelf}
                        onClick={() =>
                          run(() => adminUnblockUser(u.id))
                        }
                      >
                        Разблокировать
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={pending || isSelf}
                        onClick={() =>
                          run(() => adminBlockUser(u.id))
                        }
                      >
                        Заблокировать
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      disabled={pending || isSelf}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Удалить пользователя ${u.email ?? u.id}? Его транзакции будут удалены (каскадом).`,
                          )
                        ) {
                          return;
                        }
                        run(() => adminDeleteUser(u.id));
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
