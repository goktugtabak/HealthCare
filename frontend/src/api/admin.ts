import api from "./client";
import { normalizePost, normalizeUser } from "./transforms";
import type { Post, User } from "@/data/types";

export interface AdminUserListFilters {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const listUsers = async (filters: AdminUserListFilters = {}): Promise<{ users: User[]; total: number }> => {
  const { data } = await api.get("/admin/users", { params: filters });
  return { users: (data.users ?? []).map(normalizeUser), total: data.total ?? 0 };
};

export const getUserMetrics = async (id: string) => {
  const { data } = await api.get(`/admin/users/${id}/metrics`);
  return data;
};

export const suspendUser = (id: string) => api.post(`/admin/users/${id}/suspend`);
export const reactivateUser = (id: string) => api.post(`/admin/users/${id}/reactivate`);
export const deactivateUser = (id: string) => api.post(`/admin/users/${id}/deactivate`);
export const verifyUserDomain = (id: string) => api.post(`/admin/users/${id}/verify-domain`);
export const hardDeleteUser = (id: string) => api.post(`/admin/users/${id}/hard-delete`);

export const listAdminPosts = async (filters: { status?: string; city?: string; domain?: string; page?: number; limit?: number } = {}): Promise<{ posts: Post[]; total: number }> => {
  const { data } = await api.get("/admin/posts", { params: filters });
  return { posts: (data.posts ?? []).map(normalizePost), total: data.total ?? 0 };
};

export const adminRemovePost = (id: string, reason?: string) =>
  api.delete(`/admin/posts/${id}`, { data: { reason } });

export const getAdminStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  result?: "success" | "failure" | "warning";
  page?: number;
  limit?: number;
}

export const listAuditLogs = async (filters: AuditLogFilters = {}) => {
  const { data } = await api.get("/admin/audit-logs", { params: filters });
  return data;
};

export const exportAuditLogsCsv = async (filters: AuditLogFilters = {}): Promise<Blob> => {
  const response = await api.get("/admin/audit-logs/export", {
    params: filters,
    responseType: "blob",
  });
  return response.data as Blob;
};

export const verifyAuditChain = async () => {
  const { data } = await api.get("/admin/audit-logs/verify-chain");
  return data;
};
