import api from "./client";
import type { MeetingRequest } from "@/data/types";

export interface CreateMeetingRequestPayload {
  postId: string;
  introductoryMessage: string;
  ndaAccepted: boolean;
  proposedSlots: string[];
}

export const listMeetingRequests = async (): Promise<MeetingRequest[]> => {
  const { data } = await api.get("/meetings");
  return Array.isArray(data) ? data : data.requests ?? [];
};

export const createMeetingRequest = async (
  payload: CreateMeetingRequestPayload,
): Promise<MeetingRequest> => {
  const { data } = await api.post("/meetings", payload);
  return data.request ?? data;
};

export const acceptMeetingRequest = async (
  id: string,
  selectedSlot: string,
): Promise<MeetingRequest> => {
  const { data } = await api.post(`/meetings/${id}/accept`, { selectedSlot });
  return data.request ?? data;
};

export const declineMeetingRequest = async (id: string): Promise<MeetingRequest> => {
  const { data } = await api.post(`/meetings/${id}/decline`);
  return data.request ?? data;
};
