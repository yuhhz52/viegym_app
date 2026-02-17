import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth";

// ===== TYPES =====

export interface ChatMessageRequest {
  receiverId: string;
  content: string;
}

export interface ChatMessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  readAt?: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
}

export interface ConversationPreview {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// ===== CHAT APIs =====

export const sendMessageAPI = async (data: ChatMessageRequest): Promise<ChatMessageResponse> => {
  const res = await apiClient.post<ApiResponse<ChatMessageResponse>>("/api/chat/messages", data);
  return res.data.result;
};

export const getMyMessagesAPI = async (): Promise<ChatMessageResponse[]> => {
  const res = await apiClient.get<ApiResponse<ChatMessageResponse[]>>("/api/chat/messages/my");
  return res.data.result;
};

export const getConversationAPI = async (userId: string): Promise<ChatMessageResponse[]> => {
  const res = await apiClient.get<ApiResponse<ChatMessageResponse[]>>(`/api/chat/messages/conversation/${userId}`);
  return res.data.result;
};

export const markAsReadAPI = async (messageId: string): Promise<ChatMessageResponse> => {
  const res = await apiClient.put<ApiResponse<ChatMessageResponse>>(`/api/chat/messages/${messageId}/read`);
  return res.data.result;
};

export const getUnreadMessagesAPI = async (): Promise<ChatMessageResponse[]> => {
  const res = await apiClient.get<ApiResponse<ChatMessageResponse[]>>("/api/chat/messages/unread");
  return res.data.result;
};

export const getUnreadCountAPI = async (): Promise<number> => {
  const res = await apiClient.get<ApiResponse<number>>("/api/chat/messages/unread/count");
  return res.data.result;
};

export const deleteConversationAPI = async (userId: string): Promise<void> => {
  await apiClient.delete(`/api/chat/messages/conversation/${userId}`);
};
