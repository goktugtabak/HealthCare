import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/SharedComponents";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { isMockMode } from "@/api";
import { cn } from "@/lib/utils";

// N8: visibility-aware polling cadence. Tab in background → no fetches.
const POLL_INTERVAL_MS =
  Number(import.meta.env.VITE_POLL_NOTIFICATIONS_MS) || 5000;
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCheck,
  Heart,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Notification } from "@/data/types";

type NotificationType = Notification["type"];
type Filter = "all" | "unread" | NotificationType;

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; label: string; ringClass: string; iconClass: string }
> = {
  interest: {
    icon: Heart,
    label: "Interest",
    ringClass: "ring-pink-500/25 bg-pink-500/10",
    iconClass: "text-pink-500",
  },
  meeting_request: {
    icon: CalendarClock,
    label: "Meeting request",
    ringClass: "ring-[hsl(var(--warning))]/25 bg-[hsl(var(--warning))]/10",
    iconClass: "text-[hsl(var(--warning))]",
  },
  meeting_confirmed: {
    icon: CalendarCheck,
    label: "Meeting confirmed",
    ringClass: "ring-success/25 bg-success/10",
    iconClass: "text-success",
  },
  post_status: {
    icon: Sparkles,
    label: "Post update",
    ringClass: "ring-primary/25 bg-primary/10",
    iconClass: "text-primary",
  },
  account: {
    icon: ShieldAlert,
    label: "Account",
    ringClass: "ring-border bg-muted",
    iconClass: "text-muted-foreground",
  },
};

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "interest", label: "Interest" },
  { key: "meeting_request", label: "Meeting requests" },
  { key: "meeting_confirmed", label: "Confirmed" },
  { key: "post_status", label: "Post updates" },
  { key: "account", label: "Account" },
];

const matchesFilter = (notification: Notification, filter: Filter) => {
  if (filter === "all") return true;
  if (filter === "unread") return !notification.read;
  return notification.type === filter;
};

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const { markAllNotificationsRead, markNotificationRead, notifications, refreshAll } =
    usePlatformData();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (isMockMode()) return;
    const tick = () => {
      if (document.visibilityState === "visible") refreshAll();
    };
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refreshAll]);

  const myNotifications = useMemo(
    () =>
      currentUser
        ? [...notifications]
            .filter((notification) => notification.userId === currentUser.id)
            .sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
        : [],
    [notifications, currentUser],
  );

  if (!currentUser) return null;

  const unreadCount = myNotifications.filter((notification) => !notification.read).length;
  const visible = myNotifications.filter((notification) => matchesFilter(notification, filter));

  return (
    <AppShell>
      <PageHero
        eyebrow="Activity"
        title="Notifications"
        description="In-app updates land here in real time. Email delivery is planned — for now, this is your source of truth."
        icon={Bell}
        meta={
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info ring-1 ring-info/20">
                <span className="tabular-nums">{unreadCount}</span> unread
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success ring-1 ring-success/20">
                All caught up
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
              <span className="tabular-nums">{myNotifications.length}</span> total
            </span>
          </div>
        }
        action={
          unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => markAllNotificationsRead(currentUser.id)}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark all read
            </Button>
          )
        }
      />

      {myNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll be notified about post interest, meeting requests, and confirmations as they happen."
        />
      ) : (
        <div className="max-w-2xl">
          <div
            role="tablist"
            className="mb-6 flex flex-wrap gap-1 rounded-full bg-muted p-1"
          >
            {FILTER_TABS.map((tab) => {
              const count =
                tab.key === "all"
                  ? myNotifications.length
                  : tab.key === "unread"
                    ? unreadCount
                    : myNotifications.filter((notification) => notification.type === tab.key).length;
              if (count === 0 && tab.key !== "all" && tab.key !== "unread") return null;
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted-foreground/10",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {visible.length > 0 ? (
            <div className="space-y-2 animate-fade-in">
              {visible.map((notification) => {
                const meta = TYPE_META[notification.type];
                const Icon = meta.icon;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markNotificationRead(notification.id)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                      notification.read
                        ? "border-border bg-card hover:bg-muted/50"
                        : "border-info/20 bg-info/5 hover:bg-info/10",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                        meta.ringClass,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", meta.iconClass)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">{notification.title}</p>
                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-info" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium">
                          {meta.label}
                        </span>
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              Nothing in this category.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default NotificationsPage;
