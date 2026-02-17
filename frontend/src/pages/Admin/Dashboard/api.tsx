import apiClient from '@/api/apiClient';


export const getDashboardStats = async () => {
const res = await apiClient.get('/api/dashboard/stats');
return res.data;
};

interface CommunityPostsResponse {
  result: any[];
}

export const getCommunityPosts = async (): Promise<any[]> => {
  const res = await apiClient.get<CommunityPostsResponse>('/api/community/posts');
  return res.data.result || [];
};