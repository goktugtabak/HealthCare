import api from "./client";
import { normalizeMeeting } from "./transforms";
import type { MeetingRequest } from "@/data/types";

export interface CreateMeetingRequestPayload {
  postId: string;
  introductoryMessage: string;
  ndaAccepted: boolean;
  proposedSlots: string[];
}

export const listMeetingRequests = async (): Promise<MeetingRequest[]> => {
  const { data } = await api.get("/meetings");
  const list = Array.isArray(data) ? data : data.meetings ?? [];
  return list.map(normalizeMeeting);
};

export const createMeetingRequest = async (
  payload: CreateMeetingRequestPayload,
): Promise<MeetingRequest> => {
  const { data } = await api.post("/meetings", payload);
  return normalizeMeeting(data.meeting ?? data);
};

export const acceptMeetingRequest = async (
  id: string,
  selectedSlot?: string,
): Promise<MeetingRequest> => {
  const { data } = await api.post(`/meetings/${id}/accept`, { selectedSlot });
  return normalizeMeeting(data.meeting ?? data);
};

export const declineMeetingRequest = async (
  id: string,
  reason?: string,
): Promise<MeetingRequest> => {
  const { data } = await api.post(`/meetings/${id}/decline`, { reason });
  return normalizeMeeting(data.meeting ?? data);
};

export const cancelMeetingRequest = async (id: string): Promise<MeetingRequest> => {
  const { data } = await api.post(`/meetings/${id}/cancel`);
  return normalizeMeeting(data.meeting ?? data);
};
