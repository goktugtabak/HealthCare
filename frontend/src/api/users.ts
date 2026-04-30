import api from "./client";
import { normalizeUser, toDb } from "./transforms";
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

const toBackendUserPayload = (updates: Partial<User>) => ({
  firstName: updates.fullName ? updates.fullName.split(" ")[0] : undefined,
  lastName: updates.fullName ? updates.fullName.split(" ").slice(1).join(" ") : undefined,
  institution: updates.institution,
  bio: updates.bio,
  city: updates.city,
  country: updates.country,
  expertiseTags: updates.expertiseTags,
  interestTags: updates.interestTags,
  portfolioSummary: updates.portfolioSummary,
  portfolioLinks: updates.portfolioLinks,
  avatar: updates.avatar,
  preferredContactMethod: updates.preferredContact
    ? toDb.contactMethod(updates.preferredContact.method)
    : undefined,
  preferredContactValue: updates.preferredContact?.value,
  notifyInApp: updates.notificationPreferences?.inApp,
  notifyEmail: updates.notificationPreferences?.email,
  onboardingCompleted: updates.onboardingCompleted,
});

export const completeOnboarding = async (payload: OnboardingPayload): Promise<User> => {
  const { data } = await api.patch("/users/me", {
    institution: payload.institution,
    city: payload.city,
    country: payload.country,
    bio: payload.bio,
    expertiseTags: payload.expertiseTags ?? [],
    interestTags: payload.interestTags ?? [],
    portfolioSummary: payload.portfolioSummary,
    portfolioLinks: payload.portfolioLinks ?? [],
    preferredContactMethod: payload.preferredContact
      ? toDb.contactMethod(payload.preferredContact.method)
      : undefined,
    preferredContactValue: payload.preferredContact?.value,
    onboardingCompleted: true,
  });
  return normalizeUser(data.user ?? data);
};

export const updateProfile = async (updates: Partial<User>): Promise<User> => {
  const { data } = await api.patch("/users/me", toBackendUserPayload(updates));
  return normalizeUser(data.user ?? data);
};

export const requestAccountDeletion = async (): Promise<void> => {
  await api.post("/users/me/request-deletion");
};

export const cancelAccountDeletion = async (): Promise<void> => {
  await api.post("/users/me/cancel-deletion");
};

export const exportMyData = async (): Promise<Blob> => {
  const response = await api.get("/users/me/export", { responseType: "blob" });
  return response.data as Blob;
};
