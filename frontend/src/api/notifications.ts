import api from "./client";
import type { Notification } from "@/data/types";

export const listNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get("/notifications");
  return Array.isArray(data) ? data : data.notifications ?? [];
};

export const markNotificationRead = async (id: string): Promise<Notification> => {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data.notification ?? data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post(`/notifications/read-all`);
};
