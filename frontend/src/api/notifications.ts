import api from "./client";
import { normalizeNotification } from "./transforms";
import type { Notification } from "@/data/types";

export const listNotifications = async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
  const { data } = await api.get("/notifications");
  const notifications = (Array.isArray(data) ? data : data.notifications ?? []).map(
    normalizeNotification,
  );
  const unreadCount = data.unreadCount ?? notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount };
};

export const markNotificationRead = async (id: string): Promise<Notification> => {
  const { data } = await api.post(`/notifications/${id}/read`);
  return normalizeNotification(data.notification ?? data);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post(`/notifications/read-all`);
};
