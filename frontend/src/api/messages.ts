import api from "./client";

export interface Message {
  id: string;
  postId: string;
  senderId: string;
  recipientId: string;
  content: string;
  ndaAcceptedAt: string | null;
  createdAt: string;
}

export interface SendMessagePayload {
  postId: string;
  recipientId: string;
  content: string;
  ndaAccepted?: boolean;
}

export const listConversations = async (): Promise<Message[]> => {
  const { data } = await api.get("/messages");
  return Array.isArray(data) ? data : data.messages ?? [];
};

export const sendMessage = async (payload: SendMessagePayload): Promise<Message> => {
  const { data } = await api.post("/messages", payload);
  return data.message ?? data;
};

export const acceptNda = async (messageId: string): Promise<Message> => {
  const { data } = await api.post(`/messages/${messageId}/accept-nda`);
  return data.message ?? data;
};
