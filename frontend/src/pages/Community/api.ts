import apiClient from "@/api/apiClient";
import type { ApiResponse, CommunityPost} from "./type";

export const getAllCommunityPosts = async (): Promise<CommunityPost[]> => {
  const res = await apiClient.get<ApiResponse<CommunityPost[]>>("/api/community/posts");
  return res.data.result;
};

// Toggle like: Nếu đã like thì unlike, chưa like thì like
// Backend xử lý logic toggle tự động
export const toggleLike = async (postId: string) => {
  const res = await apiClient.post<ApiResponse<{ likeCount: number; isLikedByCurrentUser: boolean }>>(`/api/community/posts/${postId}/likes`);
  return res.data.result;
};

// API riêng biệt (deprecated - khuyến nghị dùng toggleLike)
export const likePost = async (postId: string) => {
  const res = await apiClient.post<ApiResponse<{ likeCount: number; isLikedByCurrentUser: boolean }>>(`/api/community/posts/${postId}/likes`);
  return res.data.result;
};

export const unlikePost = async (postId: string) => {
  const res = await apiClient.delete<ApiResponse<{ likeCount: number; isLikedByCurrentUser: boolean }>>(`/api/community/posts/${postId}/likes`);
  return res.data.result;
};

export interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  parentCommentId?: string | null;
  replies: Comment[];
}

export const getComments = async (postId: string): Promise<Comment[]> => {
  const res = await apiClient.get<ApiResponse<Comment[]>>(
    `/api/community/posts/${postId}/comments`
  );
  return res.data.result;
};

export const addComment = async (postId: string, content: string, parentCommentId?: string) => {
  const payload: { content: string; parentCommentId?: string } = { content };
  if (parentCommentId) payload.parentCommentId = parentCommentId;

  const res = await apiClient.post<ApiResponse<Comment>>(`/api/community/posts/${postId}/comments`, payload);
  return res.data.result;
};

export const uploadMedia = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiResponse<string>>("/api/media/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.result;
};

export interface CreatePostRequest {
  title?: string;
  content: string;
  mediaUrls?: string[];
}

export const createPost = async (data: CreatePostRequest): Promise<CommunityPost> => {
  const res = await apiClient.post<ApiResponse<CommunityPost>>("/api/community/posts", data);
  return res.data.result;
};

export interface ReportPostRequest {
  reason: string;
  description?: string;
}

export const reportPost = async (postId: string, data: ReportPostRequest): Promise<string> => {
  const res = await apiClient.post<ApiResponse<string>>(`/api/community/posts/${postId}/report`, data);
  return res.data.result;
};
