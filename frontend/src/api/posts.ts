import api from "./client";
import { fromDb, normalizePost, toDb } from "./transforms";
import type { Post, PostStatus } from "@/data/types";

export interface PostFilters {
  domain?: string;
  stage?: string;
  search?: string;
  ownerId?: string;
  status?: PostStatus;
  city?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export interface CreatePostPayload {
  title: string;
  workingDomain: string;
  shortExplanation: string;
  requiredExpertise: string[];
  projectStage: string;
  collaborationType: string;
  confidentialityLevel: Post["confidentialityLevel"];
  country: string;
  city: string;
  expiryDate: string;
  autoClose: boolean;
  commitmentLevel: string;
  highLevelIdea: string;
  publish: boolean;
}

export type UpdatePostPayload = CreatePostPayload;

const toBackendPayload = (payload: Partial<CreatePostPayload>) => ({
  title: payload.title,
  workingDomain: payload.workingDomain,
  shortExplanation: payload.shortExplanation,
  requiredExpertise: payload.requiredExpertise,
  matchTags: payload.requiredExpertise?.slice(0, 4),
  projectStage: payload.projectStage ? toDb.stage(payload.projectStage) : undefined,
  confidentiality: payload.confidentialityLevel
    ? toDb.confidentiality(payload.confidentialityLevel)
    : undefined,
  collaborationType: payload.collaborationType,
  commitmentLevel: payload.commitmentLevel,
  highLevelIdea: payload.highLevelIdea,
  country: payload.country,
  city: payload.city,
  expiryDate: payload.expiryDate || undefined,
  autoClose: payload.autoClose,
  publish: payload.publish,
});

export const listPosts = async (filters: PostFilters = {}): Promise<Post[]> => {
  const params: Record<string, string | number | undefined> = {
    domain: filters.domain,
    stage: filters.stage ? toDb.stage(filters.stage) : undefined,
    status: filters.status ? toDb.postStatus(filters.status) : undefined,
    city: filters.city,
    country: filters.country,
    ownerId: filters.ownerId,
    search: filters.search,
    page: filters.page,
    limit: filters.limit,
  };
  const { data } = await api.get("/posts", { params });
  const list = Array.isArray(data) ? data : data.posts ?? [];
  return list.map(normalizePost);
};

export const listMyPosts = async (): Promise<Post[]> => {
  const { data } = await api.get("/posts/mine");
  const list = Array.isArray(data) ? data : data.posts ?? [];
  return list.map(normalizePost);
};

export const getPost = async (id: string): Promise<Post> => {
  const { data } = await api.get(`/posts/${id}`);
  return normalizePost(data.post ?? data);
};

export const createPost = async (payload: CreatePostPayload): Promise<Post> => {
  const { data } = await api.post("/posts", toBackendPayload(payload));
  return normalizePost(data.post ?? data);
};

export const updatePost = async (id: string, payload: UpdatePostPayload): Promise<Post> => {
  const { data } = await api.put(`/posts/${id}`, toBackendPayload(payload));
  return normalizePost(data.post ?? data);
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/posts/${id}`);
};

export const setPostStatus = async (
  id: string,
  status: PostStatus,
  reason?: string,
): Promise<Post> => {
  const { data } = await api.post(`/posts/${id}/status`, {
    status: toDb.postStatus(status),
    reason,
  });
  return normalizePost(data.post ?? data);
};

export const markPostClosed = async (id: string): Promise<Post> => {
  const { data } = await api.post(`/posts/${id}/mark-closed`);
  return normalizePost(data.post ?? data);
};

export { fromDb, toDb };
