import api from "./client";
import type { User } from "@/data/types";

export interface OnboardingPayload {
  institution: string;
  city: string;
  country: string;
  bio: string;
  preferredContact: User["preferredContact"];
  interestTags?: string[];
  expertiseTags?: string[];
  portfolioSummary?: string;
  portfolioLinks?: string[];
}

export const completeOnboarding = async (payload: OnboardingPayload): Promise<User> => {
  const { data } = await api.post("/users/me/onboarding", payload);
  return data.user ?? data;
};

export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const { data } = await api.patch("/users/me", updates);
  return data.user ?? data;
};

export const getUser = async (userId: string): Promise<User> => {
  const { data } = await api.get(`/users/${userId}`);
  return data.user ?? data;
};
