"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationsAdapter } from "@/lib/api/adapters/notifications-adapter";
import { useSession } from "@/components/providers/auth-provider";
import type { AppNotification } from "@/types/domain/notification";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Loads the signed-in user's cross-module notifications — see
 * `NotificationsAdapter.getForUser` for the full permission → condition →
 * message rule table. The 4 consumers (Topbar bell, `/dashboard/notifications`,
 * `/dashboard` portal home, `/admin` ops dashboard's "Needs your attention"
 * section) all call this one hook rather than each re-deriving the list.
 *
 * Polls every 60s while mounted so a badge count doesn't go stale for a
 * tab left open — cheap for a mock adapter, and the same kind of
 * lightweight polling `AuthProvider` already does for session expiry.
 */
const POLL_INTERVAL_MS = 60_000;

export function useNotifications() {
  const { session } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const user = session?.user;
    if (!user) {
      setStatus("idle");
      setNotifications([]);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    notificationsAdapter
      .getForUser(user)
      .then((result) => {
        if (cancelled) return;
        setNotifications(result);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load notifications. Please try again.");
      });
    const interval = setInterval(() => setReloadToken((t) => t + 1), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.user, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, notifications, refetch };
}
