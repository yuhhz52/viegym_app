import apiClient from "@/api/apiClient";
import type { ApiResponse, Program } from "@/types/program";

export const getAllPublicProgramsAPI = async (): Promise<Program[]> => {
  const res = await apiClient.get<ApiResponse<Program[]>>("/api/programs");
  return res.data.result;
};

export const getPopularProgramsAPI = async (limit: number = 10): Promise<Program[]> => {
  const res = await apiClient.get<ApiResponse<Program[]>>(`/api/programs/popular?limit=${limit}`);
  return res.data.result;
};

export const getProgramDetailAPI = async (id: string): Promise<Program> => {
  const res = await apiClient.get<ApiResponse<Program>>(`/api/programs/${id}`);
  return res.data.result;
};


export const getProgramStatsAPI = async (programId: string): Promise<{
  programId: string;
  averageRating: number;
  totalRatings: number;
  totalSaves: number;
  isSaved: boolean;
  userRating: number | null;
}> => {
  const res = await apiClient.get<ApiResponse<any>>(`/api/programs/${programId}/stats`);
  return res.data.result;
};


export const saveProgramAPI = async (programId: string): Promise<void> => {
  await apiClient.post(`/api/programs/${programId}/save`);
};

export const unsaveProgramAPI = async (programId: string): Promise<void> => {
  await apiClient.delete(`/api/programs/${programId}/save`);
};


export const rateProgramAPI = async (
  programId: string,
  data: { rating: number; review?: string }
): Promise<any> => {
  const res = await apiClient.post<ApiResponse<any>>(`/api/programs/${programId}/rate`, data);
  return res.data.result;
};

export interface CoachResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  certifications?: string[];
  rating?: number;
  clientCount?: number;
}

export const getCoachesAPI = async (): Promise<CoachResponse[]> => {
  const res = await apiClient.get<ApiResponse<any[]>>("/api/user/coaches");
  // Map UserResponse to CoachResponse
  return (res.data.result || []).map((user: any) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    specialization: user.experienceLevel, // Use experienceLevel as specialization
    bio: user.goal ? `Mục tiêu: ${user.goal}` : undefined,
    experienceYears: undefined, // Not available in UserResponse
    certifications: undefined, // Not available in UserResponse
    rating: undefined, // Not available in UserResponse
    clientCount: undefined, // Not available in UserResponse
  }));
};