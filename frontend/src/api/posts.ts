import api from "./client";
import type { Post, PostStatus } from "@/data/types";

export interface PostFilters {
  domain?: string;
  stage?: string;
  search?: string;
  ownerId?: string;
  status?: PostStatus;
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

export const listPosts = async (filters: PostFilters = {}): Promise<Post[]> => {
  const { data } = await api.get("/posts", { params: filters });
  return Array.isArray(data) ? data : data.posts ?? [];
};

export const getPost = async (id: string): Promise<Post> => {
  const { data } = await api.get(`/posts/${id}`);
  return data.post ?? data;
};

export const createPost = async (payload: CreatePostPayload): Promise<Post> => {
  const { data } = await api.post("/posts", payload);
  return data.post ?? data;
};

export const updatePost = async (id: string, payload: UpdatePostPayload): Promise<Post> => {
  const { data } = await api.put(`/posts/${id}`, payload);
  return data.post ?? data;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/posts/${id}`);
};

export const setPostStatus = async (id: string, status: PostStatus): Promise<Post> => {
  const { data } = await api.post(`/posts/${id}/status`, { status });
  return data.post ?? data;
};

export const markPostClosed = async (id: string): Promise<Post> => {
  const { data } = await api.post(`/posts/${id}/mark-closed`);
  return data.post ?? data;
};
