import apiClient from "@/api/apiClient";

// Lấy danh sách posts
export const adminGetPosts = async () => {
  const res = await apiClient.get<{ result: any }>("/api/community/posts");
  return res.data.result;
};

// Lấy post theo id
export const adminGetPostById = async (id: string) => {
  const res = await apiClient.get<{ result: any }>(`/api/community/posts/${id}`);
  return res.data.result;
};

// Xóa bài post
export const adminDeletePost = async (id: string) => {
  const res = await apiClient.delete<{ result: any }>(`/api/community/posts/${id}`);
  return res.data.result;
};

export const adminCreatePost = async (data: any) => {
  const res = await apiClient.post<{ result: any }>("/api/community/posts", data);
  return res.data.result;
};

export const adminUpdatePost = async (id: string, data: any) => {
  const res = await apiClient.put<{ result: any }>(`/api/community/posts/${id}`, data);
  return res.data.result;
};


// Lấy comments theo postId
export const adminGetComments = async (postId: string) => {
  const res = await apiClient.get<{ result: any }>(`/api/community/posts/${postId}/comments`);
  return res.data.result;
};

// Xóa comment
export const adminDeleteComment = async (commentId: string) => {
  const res = await apiClient.delete<{ result: any }>(`/api/community/comments/${commentId}`);
  return res.data.result;
};

// Xóa tất cả báo cáo của bài viết (cho bài quay lại bình thường)
export const adminClearReports = async (postId: string) => {
  console.log('🌐 [API] Calling DELETE /api/community/posts/{postId}/reports with postId:', postId);
  try {
    const res = await apiClient.delete<{ result: any }>(`/api/community/posts/${postId}/reports`);
    console.log('✅ [API] Clear reports response:', res.data);
    return res.data.result;
  } catch (error: any) {
    console.error('❌ [API] Clear reports failed:', {
      url: `/api/community/posts/${postId}/reports`,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message
    });
    throw error;
  }
};
