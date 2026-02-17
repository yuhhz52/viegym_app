// api/programAPI.ts
import apiClient from "./apiClient";
import type { ApiResponse, Program, ProgramExercise, ProgramRequest } from "../types/program";

/** 1️ Lấy tất cả chương trình */
export const getAllProgramsAPI = async (): Promise<Program[]> => {
  const res = await apiClient.get<ApiResponse<Program[]>>("/api/programs");
  return res.data.result;
};

/** 2️ Xem chi tiết chương trình */
export const getProgramByIdAPI = async (id: string): Promise<Program> => {
  const res = await apiClient.get<ApiResponse<Program>>(`/api/programs/${id}`);
  return res.data.result;
};

/** 3️ Tạo chương trình mới */
export const createProgramAPI = async (data: ProgramRequest): Promise<Program> => {
  const res = await apiClient.post<ApiResponse<Program>>("/api/programs", data);
  return res.data.result;
};

/** 4️ Cập nhật chương trình */
export const updateProgramAPI = async (id: string, data: Partial<ProgramRequest>): Promise<Program> => {
  const res = await apiClient.put<ApiResponse<Program>>(`/api/programs/${id}`, data);
  return res.data.result;
};

/** 5️ Xóa chương trình */
export const deleteProgramAPI = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/programs/${id}`);
};

/** 6️ Lấy danh sách bài tập trong chương trình */
export const getProgramExercisesAPI = async (programId: string): Promise<ProgramExercise[]> => {
  const res = await apiClient.get<ApiResponse<ProgramExercise[]>>(`/api/programs/${programId}/exercises`);
  return res.data.result;
};

/** 7️ Thêm bài tập vào chương trình */
export const addExerciseToProgramAPI = async (
  programId: string,
  data: Omit<ProgramExercise, "id" | "exercise.name">
): Promise<ProgramExercise> => {
  const res = await apiClient.post<ApiResponse<ProgramExercise>>(
    `/api/programs/${programId}/exercises`,
    data
  );
  return res.data.result;
};

/** 8️ Cập nhật bài tập trong chương trình */
export const updateProgramExerciseAPI = async (
  exerciseId: string,
  data: Partial<ProgramExercise>
): Promise<ProgramExercise> => {
  const res = await apiClient.put<ApiResponse<ProgramExercise>>(
    `/api/programs/exercises/${exerciseId}`,
    data
  );
  return res.data.result;
};

/** 9️ Xóa bài tập khỏi chương trình */
export const deleteProgramExerciseAPI = async (exerciseId: string): Promise<void> => {
  await apiClient.delete(`/api/programs/exercises/${exerciseId}`);
};

/** 10️ Lấy chương trình phổ biến (dựa trên số lượng đánh giá) */
export const getPopularProgramsAPI = async (limit: number = 10): Promise<Program[]> => {
  const res = await apiClient.get<ApiResponse<Program[]>>(`/api/programs/popular?limit=${limit}`);
  return res.data.result;
};

/** 11️ Đánh giá chương trình */
export const rateProgramAPI = async (
  programId: string,
  data: { rating: number; review?: string }
): Promise<any> => {
  const res = await apiClient.post<ApiResponse<any>>(`/api/programs/${programId}/rate`, data);
  return res.data.result;
};

/** 12️ Lấy danh sách đánh giá của chương trình */
export const getProgramRatingsAPI = async (programId: string): Promise<any[]> => {
  const res = await apiClient.get<ApiResponse<any[]>>(`/api/programs/${programId}/ratings`);
  return res.data.result;
};

/** 13️ Lấy thống kê chương trình (average rating, total ratings, isSaved) */
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

/** 14️ Lưu chương trình */
export const saveProgramAPI = async (programId: string): Promise<void> => {
  await apiClient.post(`/api/programs/${programId}/save`);
};

/** 15️ Bỏ lưu chương trình */
export const unsaveProgramAPI = async (programId: string): Promise<void> => {
  await apiClient.delete(`/api/programs/${programId}/save`);
};

/** 16️ Lấy danh sách chương trình đã lưu */
export const getSavedProgramsAPI = async (): Promise<Program[]> => {
  const res = await apiClient.get<ApiResponse<Program[]>>("/api/programs/saved");
  return res.data.result;
};
